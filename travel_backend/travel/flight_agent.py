import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from serpapi import GoogleSearch
from dotenv import load_dotenv

load_dotenv()

# Load Google countries mapping once
_GOOGLE_COUNTRIES_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'google-countries.json')
_COUNTRY_NAME_TO_CODE: dict[str, str] = {}
try:
    with open(_GOOGLE_COUNTRIES_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for entry in data:
            code = str(entry.get('country_code', '')).strip().lower()
            name = str(entry.get('country_name', '')).strip().lower()
            if code and name:
                _COUNTRY_NAME_TO_CODE[name] = code
                _COUNTRY_NAME_TO_CODE[code] = code
        # Common aliases
        _COUNTRY_NAME_TO_CODE['uk'] = 'gb'
        _COUNTRY_NAME_TO_CODE['united kingdom'] = 'gb'
except Exception:
    _COUNTRY_NAME_TO_CODE = {}


class FlightSearchTool:
    """Tool for searching flights using SerpAPI Google Flights"""

    def __init__(self, serpapi_key: str):
        self.serpapi_key = serpapi_key
    
    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        country: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Search for flights using SerpAPI Google Flights

        Args:
            origin: Departure airport/city code (e.g., 'JFK', 'NYC')
            destination: Arrival airport/city code (e.g., 'NRT', 'TYO')
            departure_date: Departure date in YYYY-MM-DD format
            return_date: Return date in YYYY-MM-DD format (optional for one-way)
            adults: Number of adult passengers
            cabin_class: Cabin class (economy, business, first)

        Returns:
            Dictionary containing flight search results
        """
        return self._search_serpapi(
            origin,
            destination,
            departure_date,
            return_date,
            adults,
            cabin_class,
            country,
        )
    
    def _normalize_gl(self, country: Optional[str]) -> Optional[str]:
        try:
            if not country:
                return None
            token = str(country).strip().lower()
            return _COUNTRY_NAME_TO_CODE.get(token, token if len(token) == 2 else None)
        except Exception:
            return None

    def _search_serpapi(self, origin: str, destination: str, departure_date: str,
                        return_date: Optional[str] = None, adults: int = 1, cabin_class: str = "economy",
                        country: Optional[str] = None) -> Dict[str, Any]:
        """Search flights using SerpAPI Google Flights as fallback"""
        try:
            base_params = {
                "engine": "google_flights",
                "api_key": self.serpapi_key,
                "departure_id": origin,
                "arrival_id": destination,
                "outbound_date": departure_date,
                "adults": adults,
                "currency": "USD",
                "hl": "en",
            }
            if return_date:
                base_params["return_date"] = return_date
            if cabin_class != "economy":
                base_params["cabin_class"] = cabin_class

            gl_primary = self._normalize_gl(country)
            gl_candidates = []
            if gl_primary:
                gl_candidates.append(gl_primary)
            # Fallbacks per SerpAPI docs and global coverage
            gl_candidates.extend([None, 'us', 'gb'])

            for gl in gl_candidates:
                params = dict(base_params)
                if gl:
                    params['gl'] = gl
                elif 'gl' in params:
                    params.pop('gl', None)
                try:
                    # Debug attempt
                    print(f"[serpapi] attempt gl={gl} dep={origin} arr={destination} date={departure_date}")
                except Exception:
                    pass
                search = GoogleSearch(params)
                results = search.get_dict()
                processed = self._process_serpapi_results(results)
                if processed.get('success') and processed.get('total_results', 0) > 0:
                    return processed

            # If all attempts empty, return last processed
            return processed
            
        except Exception as e:
            return {
                "success": False,
                "error": f"SerpAPI search failed: {str(e)}",
                "flights": []
            }
    
    def _process_serpapi_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Process and format flight search results from SerpAPI"""
        processed_flights = []
        
        try:
            # Extract flight options from SerpAPI response (support both legacy and current keys)
            collections = []
            if isinstance(results, dict):
                if "best_flights" in results and isinstance(results["best_flights"], list):
                    collections.append(results["best_flights"])
                if "other_flights" in results and isinstance(results["other_flights"], list):
                    collections.append(results["other_flights"])
                if "flights_results" in results and isinstance(results["flights_results"], list):
                    collections.append(results["flights_results"])  # legacy

            for coll in collections:
                for flight_option in coll:
                    processed_flight = self._extract_serpapi_flight_data(flight_option)
                    if processed_flight:
                        processed_flights.append(processed_flight)
            
            return {
                "success": True,
                "flights": processed_flights,
                "total_results": len(processed_flights),
                "data_source": "serpapi",
                "search_info": results.get("request_info", {})
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to process SerpAPI results: {str(e)}",
                "flights": []
            }
    
    def _extract_serpapi_flight_data(self, flight_option: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract relevant flight data from SerpAPI response"""
        try:
            flights = flight_option.get("flights", [])
            if not flights:
                return None
            
            first_flight = flights[0]
            last_flight = flights[-1]
            
            total_duration = flight_option.get("total_duration", 0)
            duration_hours = total_duration // 60
            duration_minutes = total_duration % 60
            
            layovers = flight_option.get("layovers", [])
            stops = len(layovers)
            
            airline = first_flight.get("airline", "Unknown")
            price = flight_option.get("price", 0)
            
            departure_info = first_flight.get("departure_airport", {})
            arrival_info = last_flight.get("arrival_airport", {})
            departure_time = departure_info.get("time", "")
            arrival_time = arrival_info.get("time", "")

            dep_code = departure_info.get("id", "")
            arr_code = arrival_info.get("id", "")
            dep_date = ""
            try:
                if departure_time:
                    dep_date = departure_time.split(" ")[0]
            except Exception:
                dep_date = ""

            # Construct a Google Flights booking/search URL
            booking_url = None
            if dep_code and arr_code and dep_date:
                # Generic query link that opens Google Flights with the route/date
                booking_url = (
                    f"https://www.google.com/travel/flights?hl=en&q={dep_code}%20to%20{arr_code}%20{dep_date}"
                )
            
            return {
                "id": f"flight_{len(flights)}_{airline}_{price}",
                "airline": airline,
                "price": price,
                "departure": dep_code,
                "arrival": arr_code,
                "duration": f"{duration_hours}h {duration_minutes}m",
                "stops": stops,
                "departureTime": departure_time,
                "arrivalTime": arrival_time,
                "type": flight_option.get("type", "Round-trip"),
                "layovers": layovers,
                "bookingUrl": booking_url,
                "raw_data": flight_option
            }
            
        except Exception as e:
            print(f"Error extracting SerpAPI flight data: {e}")
            return None
    
    def _calculate_duration(self, dep_time: str, arr_time: str) -> str:
        """Calculate flight duration from departure and arrival times"""
        try:
            if not dep_time or not arr_time:
                return "Unknown"
            
            dep_dt = datetime.fromisoformat(dep_time.replace('Z', '+00:00'))
            arr_dt = datetime.fromisoformat(arr_time.replace('Z', '+00:00'))
            
            duration = arr_dt - dep_dt
            hours = int(duration.total_seconds() // 3600)
            minutes = int((duration.total_seconds() % 3600) // 60)
            
            return f"{hours}h {minutes}m"
            
        except Exception:
            return "Unknown"
    
    def _format_time(self, time_str: str) -> str:
        """Format ISO time string to readable time"""
        try:
            if not time_str:
                return "Unknown"
            
            dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            return dt.strftime("%H:%M")
            
        except Exception:
            return "Unknown"
    
    # Removed AviationStack-based price estimation since we rely on SerpAPI pricing when available


class FlightAIAgent:
    """AI Agent for intelligent flight search and recommendations using hybrid API approach"""
    
    def __init__(self, openai_api_key: str, serpapi_key: str):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            api_key=openai_api_key
        )
        self.flight_search = FlightSearchTool(serpapi_key)
        # Prepare agent executor (not used in normal flow to keep responses fast)
        self.agent_executor = self._create_agent()
    
    def _create_agent(self) -> AgentExecutor:
        """Create the LangChain agent with flight search tools"""
        
        @tool
        def search_flights(origin: str, destination: str, departure_date: str, 
                          return_date: str = None, adults: int = 1, cabin_class: str = "economy") -> str:
            """Search for flights between two locations on specific dates using AviationStack with SerpAPI fallback"""
            results = self.flight_search.search_flights(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                cabin_class=cabin_class
            )
            return json.dumps(results, indent=2)
        
        @tool
        def analyze_flight_options(flight_data: str) -> str:
            """Analyze flight options and provide intelligent recommendations based on price, duration, and convenience"""
            try:
                flights = json.loads(flight_data)
                if not flights.get("success", False):
                    return "No flight data available for analysis."
                
                flight_list = flights.get("flights", [])
                if not flight_list:
                    return "No flights found for the given criteria."
                
                # Sort flights by different criteria
                by_price = sorted(flight_list, key=lambda x: x.get("price", float('inf')))
                by_duration = sorted(flight_list, key=lambda x: self._parse_duration(x.get("duration", "0h 0m")))
                by_stops = sorted(flight_list, key=lambda x: x.get("stops", 0))
                
                analysis = {
                    "total_flights": len(flight_list),
                    "data_source": flights.get("data_source", "unknown"),
                    "price_range": {
                        "lowest": by_price[0]["price"] if by_price else 0,
                        "highest": by_price[-1]["price"] if by_price else 0
                    },
                    "recommendations": {
                        "best_value": by_price[0] if by_price else None,
                        "fastest": by_duration[0] if by_duration else None,
                        "most_convenient": by_stops[0] if by_stops else None
                    },
                    "summary": f"Found {len(flight_list)} flights using {flights.get('data_source', 'unknown')} data. Price range: ${by_price[0]['price'] if by_price else 0} - ${by_price[-1]['price'] if by_price else 0}"
                }
                
                return json.dumps(analysis, indent=2)
                
            except Exception as e:
                return f"Error analyzing flights: {str(e)}"
        
        # Create the agent prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an intelligent flight search assistant using a hybrid approach with AviationStack and SerpAPI. Your job is to help users find the best flights based on their preferences and trip details.

When searching for flights:
1. Use the search_flights tool to find available flights (tries AviationStack first, then SerpAPI)
2. Use the analyze_flight_options tool to provide intelligent recommendations
3. Consider factors like price, duration, number of stops, and convenience
4. Provide clear, helpful recommendations with explanations
5. Note the data source used (AviationStack for real-time data, SerpAPI for broader search)

Always return your responses in a structured JSON format that can be easily parsed by the frontend."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create the agent
        agent = create_openai_tools_agent(self.llm, [search_flights, analyze_flight_options], prompt)
        # Keep verbose disabled to avoid noisy logs
        return AgentExecutor(agent=agent, tools=[search_flights, analyze_flight_options], verbose=False)

    def _destination_candidates(self, destination: str) -> List[str]:
        """Generate plausible arrival_id candidates (IATA/city codes) for Google Flights.
        Keeps it small and deterministic for speed.
        """
        if not destination:
            return []
        raw = str(destination).strip()
        candidates: List[str] = []

        # If already likely an IATA/city code
        up = raw.strip().upper()
        if len(up) in (3, 4) and up.isalpha():
            candidates.append(up)

        # Use first token (city hint)
        city_token = raw.split(',')[0].strip().lower()
        city_to_iata = {
            # Common cities
            'oslo': 'OSL', 'bergen': 'BGO', 'trondheim': 'TRD', 'stavanger': 'SVG',
            'sydney': 'SYD', 'melbourne': 'MEL', 'brisbane': 'BNE', 'perth': 'PER',
            'london': 'LHR', 'paris': 'CDG', 'frankfurt': 'FRA', 'amsterdam': 'AMS',
            'tokyo': 'TYO', 'singapore': 'SIN', 'hong kong': 'HKG', 'new york': 'JFK',
            'delhi': 'DEL', 'mumbai': 'BOM', 'bangkok': 'BKK', 'dubai': 'DXB',
        }
        if city_token in city_to_iata:
            candidates.append(city_to_iata[city_token])

        # Country-level fallbacks: try major airports
        country_token = raw.lower().strip()
        country_to_iatas = {
            'norway': ['OSL', 'BGO', 'TRD', 'SVG'],
            'australia': ['SYD', 'MEL', 'BNE', 'PER'],
            'united kingdom': ['LHR', 'LGW', 'MAN', 'EDI'], 'uk': ['LHR', 'LGW', 'MAN', 'EDI'],
            'united states': ['JFK', 'LAX', 'ORD', 'SFO', 'MIA'], 'usa': ['JFK', 'LAX', 'ORD', 'SFO', 'MIA'],
            'japan': ['TYO', 'HND', 'NRT', 'KIX'],
            'india': ['DEL', 'BOM', 'BLR'],
        }
        if country_token in country_to_iatas:
            candidates.extend(country_to_iatas[country_token])

        # Deduplicate while preserving order
        seen = set()
        unique = []
        for c in candidates:
            if c not in seen:
                seen.add(c)
                unique.append(c)
        return unique
    
    def _parse_duration(self, duration_str: str) -> int:
        """Parse duration string to total minutes"""
        try:
            parts = duration_str.split()
            hours = int(parts[0].replace('h', ''))
            minutes = int(parts[1].replace('m', '')) if len(parts) > 1 else 0
            return hours * 60 + minutes
        except:
            return 0
    
    def _analyze_flights_simple(self, flight_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            by_price = sorted(flight_list, key=lambda x: x.get("price", float('inf')))
            # parse duration like "31h 55m" to minutes
            def dur_to_min(d: str) -> int:
                try:
                    parts = d.split()
                    hours = int(parts[0].replace('h', '')) if parts else 0
                    minutes = int(parts[1].replace('m', '')) if len(parts) > 1 else 0
                    return hours * 60 + minutes
                except:
                    return 1_000_000
            by_duration = sorted(flight_list, key=lambda x: dur_to_min(x.get("duration", "")))
            by_stops = sorted(flight_list, key=lambda x: x.get("stops", 0))
            summary = f"Found {len(flight_list)} flights. Price range: ${by_price[0]['price'] if by_price else 0} - ${by_price[-1]['price'] if by_price else 0}"
            return {
                "total_flights": len(flight_list),
                "price_range": {
                    "lowest": by_price[0]["price"] if by_price else 0,
                    "highest": by_price[-1]["price"] if by_price else 0,
                },
                "recommendations": {
                    "best_value": by_price[0] if by_price else None,
                    "fastest": by_duration[0] if by_duration else None,
                    "most_convenient": by_stops[0] if by_stops else None,
                },
                "summary": summary,
            }
        except Exception as e:
            return {
                "total_flights": len(flight_list),
                "price_range": {"lowest": 0, "highest": 0},
                "recommendations": {"best_value": None, "fastest": None, "most_convenient": None},
                "summary": f"Found {len(flight_list)} flights.",
                "error": f"Analysis error: {str(e)}",
            }

    async def search_and_recommend_flights(self, 
                                         origin: str, 
                                         destination: str, 
                                         departure_date: str,
                                         return_date: Optional[str] = None,
                                         adults: int = 1,
                                         cabin_class: str = "economy",
                                          preferences: Optional[Dict[str, Any]] = None,
                                          country: Optional[str] = None) -> Dict[str, Any]:
        """
        Search for flights and provide AI-powered recommendations using hybrid API approach
        
        Args:
            origin: Departure location
            destination: Arrival location
            departure_date: Departure date
            return_date: Return date (optional)
            adults: Number of passengers
            cabin_class: Preferred cabin class
            preferences: User preferences (budget, max_stops, etc.)
        
        Returns:
            Dictionary with flight search results and AI recommendations
        """
        try:
            # Create the search query for the agent
            query = f"""Search for flights from {origin} to {destination} on {departure_date}"""
            if return_date:
                query += f" with return on {return_date}"
            query += f" for {adults} adult(s) in {cabin_class} class."
            
            if preferences:
                if preferences.get("max_budget"):
                    query += f" Budget should be under ${preferences['max_budget']}."
                if preferences.get("max_stops"):
                    query += f" Prefer flights with {preferences['max_stops']} or fewer stops."
                if preferences.get("preferred_airlines"):
                    query += f" Preferred airlines: {', '.join(preferences['preferred_airlines'])}."
            
            query += " Provide detailed analysis and recommendations."
            
            # Candidate sets for robust retries
            def unique(seq):
                seen = set(); out = []
                for x in seq:
                    if x and x not in seen:
                        seen.add(x); out.append(x)
                return out

            dest_candidates = [destination] + self._destination_candidates(destination)
            # Special handling for Tokyo
            if isinstance(destination, str) and destination.lower().find('tokyo') >= 0:
                dest_candidates = ['TYO', 'HND', 'NRT'] + dest_candidates
            dest_candidates = unique(dest_candidates)[:8]

            # Origin candidates based on user country hubs
            country_hubs = {
                'us': ['JFK', 'LAX', 'SFO', 'ORD'],
                'in': ['DEL', 'BOM', 'BLR'],
                'gb': ['LHR', 'LGW'], 'uk': ['LHR', 'LGW'],
                'ae': ['DXB', 'AUH'],
                'sg': ['SIN'],
                'jp': ['HND', 'NRT'],
                'au': ['SYD', 'MEL'],
                'de': ['FRA', 'MUC'],
                'fr': ['CDG', 'ORY'],
            }
            origin_candidates = [origin]
            if country:
                hubs = country_hubs.get(str(country).lower())
                if hubs:
                    origin_candidates.extend(hubs)
            origin_candidates = unique(origin_candidates)[:6]

            # Try combinations in a staged manner to stop as soon as we get success
            last_result: Dict[str, Any] = {}
            from datetime import datetime, timedelta
            try:
                base_dt = datetime.strptime(departure_date, "%Y-%m-%d")
            except Exception:
                base_dt = datetime.utcnow() + timedelta(days=14)
            date_offsets = [0, 1, -1, 2, -2]

            def _try_search(origins: List[str], destinations: List[str], offsets: List[int]) -> Optional[Dict[str, Any]]:
                nonlocal last_result
                for o in origins:
                    for d in destinations:
                        for off in offsets:
                            dep_try = (base_dt + timedelta(days=off)).strftime("%Y-%m-%d")
                            direct_results = self.flight_search.search_flights(
                                origin=o,
                                destination=d,
                                departure_date=dep_try,
                                return_date=return_date,
                                adults=adults,
                                cabin_class=cabin_class,
                                country=country,
                            )
                            last_result = direct_results
                            flights = direct_results.get("flights", []) if isinstance(direct_results, dict) else []
                            if flights:
                                analysis = self._analyze_flights_simple(flights)
                                return {
                                    "success": True,
                                    "data": {
                                        "flights": flights,
                                        "recommendations": analysis.get("recommendations"),
                                        "total_flights": analysis.get("total_flights"),
                                        "price_range": analysis.get("price_range"),
                                        "summary": analysis.get("summary"),
                                        "data_source": direct_results.get("data_source", "serpapi"),
                                    },
                                    "raw_response": None,
                                }
                return None

            # Stage 1: exact provided origin and destination only
            result_stage1 = _try_search([origin], [destination], date_offsets)
            if result_stage1:
                return result_stage1

            # Stage 2: provided origin with destination candidates
            result_stage2 = _try_search([origin], dest_candidates, date_offsets)
            if result_stage2:
                return result_stage2

            # Stage 3: alternate origin hubs (excluding the original), with top destination candidates
            alt_origins = [o for o in origin_candidates if o != origin]
            top_dest_candidates = dest_candidates[:4] if len(dest_candidates) > 4 else dest_candidates
            result_stage3 = _try_search(alt_origins, top_dest_candidates, date_offsets)
            if result_stage3:
                return result_stage3

            # Retry deterministically with arrival_id candidates derived from destination string
            for cand in self._destination_candidates(destination)[:6]:
                if not cand:
                    continue
                retry_results = self.flight_search.search_flights(
                    origin=origin,
                    destination=cand,
                    departure_date=departure_date,
                    return_date=return_date,
                    adults=adults,
                    cabin_class=cabin_class,
                    country=country,
                )
                cand_flights = retry_results.get("flights", []) if isinstance(retry_results, dict) else []
                if cand_flights:
                    analysis = self._analyze_flights_simple(cand_flights)
                    return {
                        "success": True,
                        "data": {
                            "flights": cand_flights,
                            "recommendations": analysis.get("recommendations"),
                            "total_flights": analysis.get("total_flights"),
                            "price_range": analysis.get("price_range"),
                            "summary": analysis.get("summary"),
                            "data_source": retry_results.get("data_source", "serpapi"),
                        },
                        "raw_response": None,
                    }

            # If no flights found, return a quick, helpful response without invoking LLM agent
            return {
                "success": True,
                "data": {
                    "flights": [],
                    "recommendations": None,
                    "total_flights": 0,
                    "price_range": {"lowest": 0, "highest": 0},
                    "summary": "No flights found for the given criteria.",
                    "data_source": (last_result.get("data_source", "serpapi") if isinstance(last_result, dict) else "serpapi"),
                },
                "raw_response": None,
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to search flights: {str(e)}",
                "data": None
            }


# Initialize the flight agent with API keys
def get_flight_agent() -> FlightAIAgent:
    """Get initialized flight AI agent using hybrid API approach"""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    serpapi_key = os.getenv("SERPAPI_KEY")
    
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    if not serpapi_key:
        raise ValueError("SERPAPI_KEY environment variable is required")
    
    return FlightAIAgent(openai_api_key, serpapi_key)
