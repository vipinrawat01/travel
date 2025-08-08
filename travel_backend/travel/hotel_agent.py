import os
import json
import re
from typing import Any, Dict, List, Optional

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from serpapi import GoogleSearch
from dotenv import load_dotenv

load_dotenv()


class HotelSearchTool:
    """Tool for searching hotels using SerpAPI Google Hotels API"""

    def __init__(self, serpapi_key: str):
        self.serpapi_key = serpapi_key

    def search_hotels(
        self,
        destination: str,
        check_in_date: str,
        check_out_date: str,
        adults: int = 1,
        currency: str = "USD",
        country: str = "us",
        language: str = "en",
        budget_max: Optional[int] = None,
    ) -> Dict[str, Any]:
        try:
            params = {
                "engine": "google_hotels",
                "api_key": self.serpapi_key,
                "q": destination,
                "check_in_date": check_in_date,
                "check_out_date": check_out_date,
                "adults": adults,
                "currency": currency,
                "gl": country,
                "hl": language,
                "vacation_rentals": False,
            }

            search = GoogleSearch(params)
            results = search.get_dict()
            try:
                print(f"HotelSearchTool: fetched results with keys: {list(results.keys())[:8]}")
            except Exception:
                pass
            return self._process_hotels_results(results, budget_max)
        except Exception as e:
            return {"success": False, "error": f"Hotel search failed: {str(e)}", "hotels": []}

    def _process_hotels_results(self, results: Dict[str, Any], budget_max: Optional[int]) -> Dict[str, Any]:
        hotels: List[Dict[str, Any]] = []
        try:
            raw_hotels = results.get("properties", []) or results.get("hotels_results", [])
            for item in raw_hotels:
                mapped = self._extract_hotel(item)
                if mapped is None:
                    continue
                if budget_max is not None and mapped.get("price", 0) > budget_max:
                    continue
                hotels.append(mapped)

            return {
                "success": True,
                "hotels": hotels,
                "total_results": len(hotels),
                "search_info": {
                    "destination": results.get("search_parameters", {}).get("q"),
                    "dates": {
                        "check_in": results.get("search_parameters", {}).get("check_in_date"),
                        "check_out": results.get("search_parameters", {}).get("check_out_date"),
                    },
                },
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to process hotels: {str(e)}", "hotels": []}

    def _extract_hotel(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            name = item.get("name") or item.get("title")
            if not name:
                return None

            # Price
            price = 0
            rate_per_night = item.get("rate_per_night") or {}
            if isinstance(rate_per_night, dict):
                price = rate_per_night.get("extracted_lowest") or rate_per_night.get("extracted_before_taxes_fees") or 0
            if not price:
                total_rate = item.get("total_rate") or {}
                if isinstance(total_rate, dict):
                    price = total_rate.get("extracted_lowest") or total_rate.get("extracted_before_taxes_fees") or 0

            rating = item.get("overall_rating") or item.get("rating") or 0
            address = item.get("address") or item.get("location") or ""
            images = item.get("images") or []
            image_url = None
            if images and isinstance(images, list):
                # SerpAPI returns objects with 'thumbnail' and 'original_image'
                first_img = images[0]
                image_url = first_img.get("thumbnail") or first_img.get("original_image")

            amenities = item.get("amenities") or []
            if isinstance(amenities, dict):
                # Some schemas group amenities
                flat = []
                for v in amenities.values():
                    if isinstance(v, list):
                        flat.extend(v)
                amenities = flat

            price_category = "budget"
            if price >= 250:
                price_category = "luxury"
            elif price >= 120:
                price_category = "comfort"

            distance = item.get("distance_from_destination") or item.get("distance") or ""

            mapped = {
                "id": item.get("property_token") or item.get("link") or name,
                "name": name,
                "price": int(price) if isinstance(price, (int, float)) else 0,
                "rating": float(rating) if isinstance(rating, (int, float)) else 0,
                "location": address,
                "distance": str(distance) if distance else "",
                "amenities": amenities if isinstance(amenities, list) else [],
                "image": image_url or "/placeholder.svg",
                "priceCategory": price_category,
            }
            return mapped
        except Exception:
            return None


class HotelAIAgent:
    """AI Agent for hotel search and recommendations (SerpAPI Google Hotels)"""

    def __init__(self, openai_api_key: str, serpapi_key: str):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, api_key=openai_api_key)
        self.hotel_search = HotelSearchTool(serpapi_key)
        self.agent_executor = self._create_agent()

    def _create_agent(self) -> AgentExecutor:
        @tool
        def search_hotels(
            destination: str,
            check_in_date: str,
            check_out_date: str,
            adults: int = 1,
            currency: str = "USD",
            country: str = "us",
            language: str = "en",
            budget_max: int = 0,
        ) -> str:
            """Search hotels at destination and dates using Google Hotels via SerpAPI"""
            result = self.hotel_search.search_hotels(
                destination=destination,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
                adults=adults,
                currency=currency,
                country=country,
                language=language,
                budget_max=budget_max or None,
            )
            return json.dumps(result, indent=2)

        @tool
        def analyze_hotel_options(hotel_data: str) -> str:
            r"""Analyze hotels and recommend best budget, best overall (rating/value), and closest.

            Accepts hotel_data as JSON string; sanitizes invalid escape sequences like \\xNN and
            strips control characters before parsing to avoid JSON decode errors.
            """
            try:
                def _sanitize_json_text(text: str) -> str:
                    # Convert literal \xNN escapes (invalid in JSON) to \u00NN which JSON accepts
                    text = re.sub(r"\\x([0-9a-fA-F]{2})", lambda m: "\\u00" + m.group(1).lower(), text)
                    # Remove any remaining control chars (0x00-0x1F)
                    text = "".join(ch if ord(ch) >= 32 else " " for ch in text)
                    return text

                safe_text = _sanitize_json_text(hotel_data)
                data = json.loads(safe_text)
                if not data.get("success"):
                    return json.dumps({"success": False, "message": "No hotel data available"})
                hotels = data.get("hotels", [])
                if not hotels:
                    return json.dumps({"success": True, "recommendations": {}})

                by_price = sorted(hotels, key=lambda h: h.get("price", 1e9))
                by_rating = sorted(hotels, key=lambda h: -h.get("rating", 0))

                def value_score(h):
                    price = h.get("price", 0) or 1
                    rating = h.get("rating", 0)
                    return rating / price

                by_value = sorted(hotels, key=value_score, reverse=True)

                recs = {
                    "best_budget": by_price[0] if by_price else None,
                    "best_rated": by_rating[0] if by_rating else None,
                    "best_value": by_value[0] if by_value else None,
                }
                return json.dumps({"success": True, "recommendations": recs}, indent=2)
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a hotel planning assistant. Use the tools to search hotels and then analyze options.
Return structured JSON that contains: hotels[], recommendations{{best_budget, best_rated, best_value}}, and a short summary.""",
                ),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        agent = create_openai_tools_agent(self.llm, [search_hotels, analyze_hotel_options], prompt)
        return AgentExecutor(agent=agent, tools=[search_hotels, analyze_hotel_options], verbose=True)

    async def search_and_recommend_hotels(
        self,
        destination: str,
        check_in_date: str,
        check_out_date: str,
        adults: int = 1,
        currency: str = "USD",
        country: str = "us",
        language: str = "en",
        budget_max: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Return only the hotel items needed by the frontend mock: id, name, price, rating, location, distance, amenities, image, priceCategory."""
        print(
            f"HotelAIAgent.search_and_recommend_hotels params: dest={destination}, dates={check_in_date}->{check_out_date}, adults={adults}, budget_max={budget_max}"
        )
        base = self.hotel_search.search_hotels(
            destination=destination,
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            adults=adults,
            currency=currency,
            country=country,
            language=language,
            budget_max=budget_max,
        )

        print(f"HotelAIAgent: raw base success={base.get('success')} total={len(base.get('hotels', [])) if isinstance(base, dict) else 'n/a'}")
        hotels = base.get("hotels", []) if isinstance(base, dict) else []

        # Ensure each item only has required fields
        trimmed: List[Dict[str, Any]] = []
        for h in hotels:
            trimmed.append(
                {
                    "id": h.get("id"),
                    "name": h.get("name"),
                    "price": h.get("price", 0),
                    "rating": h.get("rating", 0.0),
                    "location": h.get("location", ""),
                    "distance": h.get("distance", ""),
                    "amenities": h.get("amenities", []),
                    "image": h.get("image", "/placeholder.svg"),
                    "priceCategory": h.get("priceCategory") or (
                        "luxury" if (h.get("price") or 0) >= 250 else ("comfort" if (h.get("price") or 0) >= 120 else "budget")
                    ),
                }
            )

        print(f"HotelAIAgent: trimmed {len(trimmed)} hotels. Sample: {trimmed[0] if trimmed else '[]'}")
        return {"success": True, "data": {"hotels": trimmed}}


def get_hotel_agent() -> HotelAIAgent:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    serpapi_key = os.getenv("SERPAPI_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    if not serpapi_key:
        raise ValueError("SERPAPI_KEY environment variable is required")
    return HotelAIAgent(openai_api_key, serpapi_key)


