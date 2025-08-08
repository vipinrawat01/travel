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
        return self._search_serpapi(origin, destination, departure_date, return_date, adults, cabin_class)
    
    def _search_serpapi(self, origin: str, destination: str, departure_date: str, 
                        return_date: Optional[str] = None, adults: int = 1, cabin_class: str = "economy") -> Dict[str, Any]:
        """Search flights using SerpAPI Google Flights as fallback"""
        try:
            search_params = {
                "engine": "google_flights",
                "api_key": self.serpapi_key,
                "departure_id": origin,
                "arrival_id": destination,
                "outbound_date": departure_date,
                "adults": adults,
                "currency": "USD",
                "hl": "en"
            }
            
            if return_date:
                search_params["return_date"] = return_date
            
            if cabin_class != "economy":
                search_params["cabin_class"] = cabin_class
            
            search = GoogleSearch(search_params)
            results = search.get_dict()
            
            return self._process_serpapi_results(results)
            
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
            # Extract flight options from SerpAPI response
            if "flights_results" in results:
                for flight_option in results["flights_results"]:
                    processed_flight = self._extract_serpapi_flight_data(flight_option)
                    if processed_flight:
                        processed_flights.append(processed_flight)
            
            # Also check for other_flights if available
            if "other_flights" in results:
                for flight_option in results["other_flights"]:
                    processed_flight = self._extract_serpapi_flight_data(flight_option)
                    if processed_flight:
                        processed_flights.append(processed_flight)
            
            return {
                "success": True,
                "flights": processed_flights,
                "total_results": len(processed_flights),
                "data_source": "serpapi",
                "search_info": {
                    "origin": results.get("request_info", {}).get("departure_id"),
                    "destination": results.get("request_info", {}).get("arrival_id"),
                    "date": results.get("request_info", {}).get("outbound_date")
                }
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
            
            departure_time = first_flight.get("departure_airport", {}).get("time", "")
            arrival_time = last_flight.get("arrival_airport", {}).get("time", "")
            
            return {
                "id": f"flight_{len(flights)}_{airline}_{price}",
                "airline": airline,
                "price": price,
                "departure": first_flight.get("departure_airport", {}).get("id", ""),
                "arrival": last_flight.get("arrival_airport", {}).get("id", ""),
                "duration": f"{duration_hours}h {duration_minutes}m",
                "stops": stops,
                "departureTime": departure_time,
                "arrivalTime": arrival_time,
                "type": flight_option.get("type", "Round-trip"),
                "layovers": layovers,
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
        return AgentExecutor(agent=agent, tools=[search_flights, analyze_flight_options], verbose=True)
    
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
                                         preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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
            
            # First, perform a direct SerpAPI search for structured results
            direct_results = self.flight_search.search_flights(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                cabin_class=cabin_class,
            )

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

            # If no flights found, use the agent to provide helpful guidance and reasoning
            result = await self.agent_executor.ainvoke({"input": query, "chat_history": []})
            response_text = result.get("output", "")
            # Try to extract a JSON explanation block if present
            parsed_result: Dict[str, Any] = {}
            if "{" in response_text and "}" in response_text:
                try:
                    start = response_text.find("{")
                    end = response_text.rfind("}") + 1
                    json_str = response_text[start:end]
                    parsed_result = json.loads(json_str)
                except Exception:
                    parsed_result = {}

            return {
                "success": True,
                "data": parsed_result if parsed_result else {"message": response_text, "status": "success"},
                "raw_response": response_text,
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
