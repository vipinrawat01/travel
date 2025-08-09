from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import UserProfile, Trip, TripItem, TripBudget, TripItinerary, UserPreference, TripPlanningStage, LiveItineraryItem
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    TripSerializer, TripCreateSerializer, TripItemSerializer, TripItemCreateSerializer,
    TripBudgetSerializer, TripItinerarySerializer, UserPreferenceSerializer,
    TripUpdateSerializer, TripItemUpdateSerializer, TripPlanningStageSerializer,
    TripPlanningStageCreateSerializer, TripPlanningStageUpdateSerializer,
    LiveItineraryItemSerializer, LiveItineraryItemCreateSerializer, LiveItineraryItemUpdateSerializer
)
import os
import requests
from urllib.parse import urlencode

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return token"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout user by deleting token"""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except:
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

# User Profile Views
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update user profile"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Trip Views
class TripListCreateView(generics.ListCreateAPIView):
    """List all trips for authenticated user or create new trip"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TripCreateSerializer
        return TripSerializer
    
    def perform_create(self, serializer):
        trip = serializer.save(user=self.request.user)
        return trip
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trip = self.perform_create(serializer)
        
        # Return the created trip with all fields including id
        response_serializer = TripSerializer(trip)
        response_data = response_serializer.data
        print(f"Debug - Created trip ID: {trip.id}")
        print(f"Debug - Response data: {response_data}")
        return Response(response_data, status=status.HTTP_201_CREATED)

class TripDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a trip"""
    permission_classes = [IsAuthenticated]
    serializer_class = TripSerializer
    
    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TripUpdateSerializer
        return TripSerializer

# Trip Items Views
class TripItemListView(generics.ListCreateAPIView):
    """List all items for a trip or create new item"""
    permission_classes = [IsAuthenticated]
    serializer_class = TripItemSerializer
    
    def get_queryset(self):
        trip_id = self.kwargs['trip_id']
        return TripItem.objects.filter(trip_id=trip_id, trip__user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TripItemCreateSerializer
        return TripItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['trip_id'] = self.kwargs['trip_id']
        return context

class TripItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a trip item"""
    permission_classes = [IsAuthenticated]
    serializer_class = TripItemSerializer
    
    def get_queryset(self):
        return TripItem.objects.filter(trip__user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TripItemUpdateSerializer
        return TripItemSerializer

# Trip Budget Views
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def trip_budget(request, trip_id):
    """Get or update trip budget"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    budget, created = TripBudget.objects.get_or_create(trip=trip, defaults={'total_budget': trip.budget})
    
    if request.method == 'GET':
        serializer = TripBudgetSerializer(budget)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TripBudgetSerializer(budget, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Trip Itinerary Views
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def trip_itinerary(request, trip_id):
    """Get or update trip itinerary"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    itinerary, created = TripItinerary.objects.get_or_create(trip=trip)
    
    if request.method == 'GET':
        serializer = TripItinerarySerializer(itinerary)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TripItinerarySerializer(itinerary, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User Preferences Views
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_preferences(request):
    """Get or update user preferences"""
    preferences, created = UserPreference.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserPreferenceSerializer(preferences)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserPreferenceSerializer(preferences, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Additional Utility Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Get user dashboard data"""
    user = request.user
    trips = Trip.objects.filter(user=user)
    
    dashboard_data = {
        'total_trips': trips.count(),
        'planned_trips': trips.filter(status='planned').count(),
        'ongoing_trips': trips.filter(status='ongoing').count(),
        'completed_trips': trips.filter(status='completed').count(),
        'recent_trips': TripSerializer(trips[:5], many=True).data,
        'total_budget': sum(trip.budget for trip in trips),
        'user_info': {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }
    
    return Response(dashboard_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def select_trip_item(request, trip_id, item_id):
    """Select/deselect a trip item"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    item = get_object_or_404(TripItem, id=item_id, trip=trip)
    
    item.is_selected = not item.is_selected
    item.save()
    
    return Response({
        'message': f"Item {'selected' if item.is_selected else 'deselected'} successfully",
        'is_selected': item.is_selected
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trip_summary(request, trip_id):
    """Get comprehensive trip summary"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    
    # Get selected items by type
    selected_items = TripItem.objects.filter(trip=trip, is_selected=True)
    items_by_type = {}
    for item in selected_items:
        if item.item_type not in items_by_type:
            items_by_type[item.item_type] = []
        items_by_type[item.item_type].append(TripItemSerializer(item).data)
    
    # Calculate total spent
    total_spent = sum(item.price for item in selected_items)
    
    summary = {
        'trip': TripSerializer(trip).data,
        'selected_items': items_by_type,
        'total_spent': total_spent,
        'remaining_budget': trip.budget - total_spent,
        'budget_percentage': (total_spent / trip.budget * 100) if trip.budget > 0 else 0
    }
    
    return Response(summary)

# Trip Planning Stage Views
class TripPlanningStageListView(generics.ListCreateAPIView):
    """List all planning stages for a trip or create new stage"""
    permission_classes = [IsAuthenticated]
    serializer_class = TripPlanningStageSerializer
    
    def get_queryset(self):
        trip_id = self.kwargs['trip_id']
        return TripPlanningStage.objects.filter(trip_id=trip_id, trip__user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TripPlanningStageCreateSerializer
        return TripPlanningStageSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['trip_id'] = self.kwargs['trip_id']
        return context

class TripPlanningStageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a planning stage"""
    permission_classes = [IsAuthenticated]
    serializer_class = TripPlanningStageSerializer
    
    def get_queryset(self):
        trip_id = self.kwargs['trip_id']
        return TripPlanningStage.objects.filter(trip_id=trip_id, trip__user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TripPlanningStageUpdateSerializer
        return TripPlanningStageSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def trip_planning_progress(request, trip_id):
    """Get or update planning progress for a trip"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    
    if request.method == 'GET':
        # Get all planning stages for this trip
        stages = TripPlanningStage.objects.filter(trip=trip)
        serializer = TripPlanningStageSerializer(stages, many=True)
        
        # Calculate progress
        total_stages = 5  # flight, hotel, attractions, food, transport
        completed_stages = stages.filter(status='completed').count()
        skipped_stages = stages.filter(status='skipped').count()
        progress_percentage = ((completed_stages + skipped_stages) / total_stages) * 100
        
        return Response({
            'trip': TripSerializer(trip).data,
            'stages': serializer.data,
            'progress': {
                'total_stages': total_stages,
                'completed_stages': completed_stages,
                'skipped_stages': skipped_stages,
                'in_progress_stages': stages.filter(status='in_progress').count(),
                'pending_stages': stages.filter(status='pending').count(),
                'progress_percentage': progress_percentage
            }
        })
    
    elif request.method == 'POST':
        # Update or create planning stages
        stage_data = request.data.get('stages', [])
        
        with transaction.atomic():
            for stage_info in stage_data:
                stage_type = stage_info.get('stage_type')
                status = stage_info.get('status', 'pending')
                selected_items = stage_info.get('selected_items', [])
                ai_options = stage_info.get('ai_options', [])
                stage_preferences = stage_info.get('stage_preferences', {})
                notes = stage_info.get('notes', '')
                
                # Get or create the planning stage
                stage, created = TripPlanningStage.objects.get_or_create(
                    trip=trip,
                    stage_type=stage_type,
                    defaults={
                        'status': status,
                        'selected_items': selected_items,
                        'ai_options': ai_options,
                        'stage_preferences': stage_preferences,
                        'notes': notes
                    }
                )
                
                if not created:
                    # Update existing stage
                    stage.status = status
                    stage.selected_items = selected_items
                    stage.ai_options = ai_options
                    stage.stage_preferences = stage_preferences
                    stage.notes = notes
                    stage.save()
        
        return Response({'message': 'Planning stages updated successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_planning_stage(request, trip_id, stage_type):
    """Update a specific planning stage"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    stage, created = TripPlanningStage.objects.get_or_create(
        trip=trip,
        stage_type=stage_type,
        defaults={'status': 'pending'}
    )
    
    serializer = TripPlanningStageUpdateSerializer(stage, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_stage_completed(request, trip_id, stage_type):
    """Mark a planning stage as completed"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    stage = get_object_or_404(TripPlanningStage, trip=trip, stage_type=stage_type)
    
    stage.mark_completed()
    serializer = TripPlanningStageSerializer(stage)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_stage_skipped(request, trip_id, stage_type):
    """Mark a planning stage as skipped"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    stage = get_object_or_404(TripPlanningStage, trip=trip, stage_type=stage_type)
    
    stage.mark_skipped()
    serializer = TripPlanningStageSerializer(stage)
    return Response(serializer.data)

# Live Itinerary Views
class LiveItineraryItemListView(generics.ListCreateAPIView):
    """List all live itinerary items for a trip or create new item"""
    permission_classes = [IsAuthenticated]
    serializer_class = LiveItineraryItemSerializer
    
    def get_queryset(self):
        trip_id = self.kwargs['trip_id']
        return LiveItineraryItem.objects.filter(trip_id=trip_id, trip__user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LiveItineraryItemCreateSerializer
        return LiveItineraryItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['trip_id'] = self.kwargs['trip_id']
        return context

class LiveItineraryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a live itinerary item"""
    permission_classes = [IsAuthenticated]
    serializer_class = LiveItineraryItemSerializer
    
    def get_queryset(self):
        trip_id = self.kwargs['trip_id']
        return LiveItineraryItem.objects.filter(trip_id=trip_id, trip__user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return LiveItineraryItemUpdateSerializer
        return LiveItineraryItemSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_itinerary_item_completed(request, trip_id, item_id):
    """Mark an itinerary item as completed"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    item = get_object_or_404(LiveItineraryItem, id=item_id, trip=trip)
    
    item.mark_completed()
    serializer = LiveItineraryItemSerializer(item)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_itinerary_item_skipped(request, trip_id, item_id):
    """Mark an itinerary item as skipped"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    item = get_object_or_404(LiveItineraryItem, id=item_id, trip=trip)
    
    item.mark_skipped()
    serializer = LiveItineraryItemSerializer(item)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_itinerary_item_times(request, trip_id, item_id):
    """Update actual start/end times for an itinerary item"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    item = get_object_or_404(LiveItineraryItem, id=item_id, trip=trip)
    
    actual_start_time = request.data.get('actual_start_time')
    actual_end_time = request.data.get('actual_end_time')
    
    item.update_times(actual_start_time, actual_end_time)
    serializer = LiveItineraryItemSerializer(item)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trip_live_itinerary(request, trip_id):
    """Get live itinerary for a trip with day-by-day breakdown"""
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    items = LiveItineraryItem.objects.filter(trip=trip).order_by('day_number', 'planned_start_time')
    
    # Group items by day
    itinerary_by_day = {}
    for item in items:
        day = item.day_number
        if day not in itinerary_by_day:
            itinerary_by_day[day] = []
        itinerary_by_day[day].append(LiveItineraryItemSerializer(item).data)
    
    return Response({
        'trip': TripSerializer(trip).data,
        'itinerary_by_day': itinerary_by_day,
        'total_items': items.count(),
        'completed_items': items.filter(is_completed=True).count(),
        'skipped_items': items.filter(is_skipped=True).count(),
        'overdue_items': items.filter(is_completed=False, is_skipped=False).count()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_flights_ai(request):
    """Search for flights using AI agent with SerpAPI"""
    try:
        from .flight_agent import get_flight_agent
        import asyncio
        
        # Extract search parameters
        data = request.data
        origin = data.get('origin')
        destination = data.get('destination')
        departure_date = data.get('departure_date')
        return_date = data.get('return_date')
        adults = data.get('adults', 1)
        cabin_class = data.get('cabin_class', 'economy')
        preferences = data.get('preferences', {})
        country = data.get('country')  # Optional 2-letter country code, e.g., 'US'
        
        # Validate required fields
        if not all([origin, destination, departure_date]):
            return Response({
                'success': False,
                'error': 'Missing required fields: origin, destination, departure_date'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get flight agent
        try:
            flight_agent = get_flight_agent()
        except ValueError as e:
            return Response({
                'success': False,
                'error': f'Configuration error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Run async flight search
        async def search_flights():
            return await flight_agent.search_and_recommend_flights(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                cabin_class=cabin_class,
                preferences=preferences,
                country=country
            )
        
        # Execute the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(search_flights())
        finally:
            loop.close()
        
        if result.get('success'):
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to search flights: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_airport_suggestions(request):
    """Get airport suggestions for autocomplete"""
    query = request.GET.get('q', '').upper()
    
    # Common airport codes and names
    airports = [
        {'code': 'JFK', 'name': 'John F. Kennedy International Airport', 'city': 'New York'},
        {'code': 'LAX', 'name': 'Los Angeles International Airport', 'city': 'Los Angeles'},
        {'code': 'ORD', 'name': 'O\'Hare International Airport', 'city': 'Chicago'},
        {'code': 'DFW', 'name': 'Dallas/Fort Worth International Airport', 'city': 'Dallas'},
        {'code': 'ATL', 'name': 'Hartsfield-Jackson Atlanta International Airport', 'city': 'Atlanta'},
        {'code': 'SFO', 'name': 'San Francisco International Airport', 'city': 'San Francisco'},
        {'code': 'MIA', 'name': 'Miami International Airport', 'city': 'Miami'},
        {'code': 'SEA', 'name': 'Seattle-Tacoma International Airport', 'city': 'Seattle'},
        {'code': 'DEN', 'name': 'Denver International Airport', 'city': 'Denver'},
        {'code': 'BOS', 'name': 'Boston Logan International Airport', 'city': 'Boston'},
        {'code': 'NRT', 'name': 'Narita International Airport', 'city': 'Tokyo'},
        {'code': 'HND', 'name': 'Haneda Airport', 'city': 'Tokyo'},
        {'code': 'CDG', 'name': 'Charles de Gaulle Airport', 'city': 'Paris'},
        {'code': 'LHR', 'name': 'Heathrow Airport', 'city': 'London'},
        {'code': 'FRA', 'name': 'Frankfurt Airport', 'city': 'Frankfurt'},
        {'code': 'AMS', 'name': 'Amsterdam Airport Schiphol', 'city': 'Amsterdam'},
        {'code': 'SIN', 'name': 'Changi Airport', 'city': 'Singapore'},
        {'code': 'HKG', 'name': 'Hong Kong International Airport', 'city': 'Hong Kong'},
        {'code': 'SYD', 'name': 'Sydney Airport', 'city': 'Sydney'},
        {'code': 'MEL', 'name': 'Melbourne Airport', 'city': 'Melbourne'},
    ]
    
    # Filter airports based on query
    if query:
        filtered_airports = [
            airport for airport in airports
            if query in airport['code'] or query in airport['name'].upper() or query in airport['city'].upper()
        ]
    else:
        filtered_airports = airports[:10]  # Return first 10 if no query
    
    return Response({
        'success': True,
        'airports': filtered_airports
    }, status=status.HTTP_200_OK)


# Hotel AI endpoints (SerpAPI Google Hotels)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_hotels_ai(request):
    """Search for hotels using AI agent with SerpAPI Google Hotels"""
    try:
        from .hotel_agent import get_hotel_agent
        import asyncio

        data = request.data
        destination = data.get('destination')
        check_in_date = data.get('check_in_date')
        check_out_date = data.get('check_out_date')
        adults = int(data.get('adults', 1))
        currency = data.get('currency', 'USD')
        country = data.get('country', 'us')
        language = data.get('language', 'en')
        budget_max = data.get('budget_max')

        if not all([destination, check_in_date, check_out_date]):
            return Response({
                'success': False,
                'error': 'Missing required fields: destination, check_in_date, check_out_date'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            hotel_agent = get_hotel_agent()
            print(f"Hotel agent created. User={request.user.username} dest={destination} dates={check_in_date}->{check_out_date} adults={adults} budget_max={budget_max}")
        except ValueError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        async def do_search():
            return await hotel_agent.search_and_recommend_hotels(
                destination=destination,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
                adults=adults,
                currency=currency,
                country=country,
                language=language,
                budget_max=budget_max,
            )

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(do_search())
        finally:
            loop.close()

        # Debug print of returned data shape and sample
        try:
            hotels = result.get('data', {}).get('hotels', []) if isinstance(result, dict) else []
            print(f"search_hotels_ai result: success={result.get('success')} count={len(hotels)}")
            if hotels:
                print(f"search_hotels_ai first hotel: {hotels[0]}")
        except Exception:
            pass

        status_code = status.HTTP_200_OK if result.get('success') else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)
    except Exception as e:
        return Response({'success': False, 'error': f'Failed to search hotels: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_events(request):
    """Search events using Ticketmaster Discovery API based on destination and dates.
    Query params: destination, start_date, end_date, countryCode? (ISO-2), size?, page?
    """
    try:
        # Accept multiple env var names for convenience
        apikey = (
            os.getenv('TICKETMASTER_API_KEY')
            or os.getenv('TICKETMASTER_CONSUMER_KEY')
            or os.getenv('TICKETMASTER_APIKEY')
            or os.getenv('TM_API_KEY')
            or os.getenv('CONSUMER_KEY')
        )
        if not apikey:
            return Response({'success': False, 'error': 'Ticketmaster API key not configured'}, status=500)

        destination = request.GET.get('destination')
        start_date = request.GET.get('start_date')  # YYYY-MM-DD
        end_date = request.GET.get('end_date')      # YYYY-MM-DD
        country_code = request.GET.get('countryCode')  # optional ISO 2
        size = request.GET.get('size', '20')
        page = request.GET.get('page', '0')

        if not destination or not start_date or not end_date:
            return Response({'success': False, 'error': 'destination, start_date, end_date are required'}, status=400)

        # Ticketmaster expects ISO8601 date-times. Use full-day ranges.
        start_iso = f"{start_date}T00:00:00Z"
        end_iso = f"{end_date}T23:59:59Z"

        # Prefer city name only for keyword to improve matching
        city_keyword = destination
        try:
            parts = [p.strip() for p in str(destination).split(',') if p.strip()]
            if parts:
                city_keyword = parts[0]
        except Exception:
            city_keyword = destination

        params = {
            'apikey': 'spGaDcjhCt7F4dORB1e5xiHs1KaGLGGB',
            'keyword': city_keyword,
            'startDateTime': start_iso,
            'endDateTime': end_iso,
            'size': size,
            'page': page,
            'sort': 'date,asc',
        }
        if country_code:
            cc = country_code.strip().upper()
            # Normalize some common variants
            if cc == 'UK':
                cc = 'GB'
            if len(cc) == 2 and cc.isalpha():
                params['countryCode'] = cc

        url = 'https://app.ticketmaster.com/discovery/v2/events.json'
        r = requests.get(url, params=params, timeout=20)
        try:
            r.raise_for_status()
        except requests.HTTPError as http_err:
            return Response({'success': False, 'error': f'Ticketmaster HTTP error: {r.status_code} {r.text[:300]}'}, status=502)

        try:
            data = r.json()
        except ValueError:
            return Response({'success': False, 'error': f'Invalid JSON from Ticketmaster: {r.text[:300]}'}, status=502)

        events = []
        embedded = data.get('_embedded', {})
        for ev in embedded.get('events', []):
            name = ev.get('name')
            id_ = ev.get('id')
            dates = ev.get('dates', {})
            start = dates.get('start', {})
            local_date = start.get('localDate')
            local_time = start.get('localTime')
            url_tm = ev.get('url')
            price = None
            if 'priceRanges' in ev and isinstance(ev['priceRanges'], list) and ev['priceRanges']:
                pr = ev['priceRanges'][0]
                price = pr.get('min')
            venue_name = None
            city = None
            if '_embedded' in ev and 'venues' in ev['_embedded'] and ev['_embedded']['venues']:
                v = ev['_embedded']['venues'][0]
                venue_name = v.get('name')
                city = (v.get('city') or {}).get('name')

            image = None
            if 'images' in ev and isinstance(ev['images'], list) and ev['images']:
                image = ev['images'][0].get('url')

            events.append({
                'id': id_,
                'name': name,
                'date': local_date,
                'time': local_time,
                'location': f"{venue_name or ''}{' • ' if venue_name and city else ''}{city or ''}",
                'price': price or 0,
                'url': url_tm,
                'image': image,
            })

        return Response({'success': True, 'data': {'events': events, 'total': len(events)}})
    except requests.HTTPError as e:
        return Response({'success': False, 'error': f'Ticketmaster HTTP error: {str(e)}'}, status=502)
    except Exception as e:
        return Response({'success': False, 'error': f'Failed to search events: {str(e)}'}, status=500)


# ---------------------- Geoapify Helpers & Endpoints ----------------------

def _get_geoapify_key(request) -> str:
    # Prefer env; allow override via request; fallback to provided key (per user request)
    env_key = os.getenv('GEOAPIFY_API_KEY')
    body_key = None
    query_key = None
    try:
        body_key = request.data.get('api_key') if hasattr(request, 'data') else None
    except Exception:
        body_key = None
    try:
        query_key = request.GET.get('api_key') if hasattr(request, 'GET') else None
    except Exception:
        query_key = None
    return env_key or body_key or query_key or '0c2d35c01c5c4a17a1ec30454a231ef4'


def _geoapify_geocode(destination: str, api_key: str):
    def _do_request(params: dict):
        url = f'https://api.geoapify.com/v1/geocode/search?{urlencode(params)}'
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return r.json()

    try:
        dest = (destination or '').strip()
        if not dest:
            return None
        # Attempt 1: full text
        params = {'text': dest, 'apiKey': api_key, 'limit': 1, 'lang': 'en'}
        data = _do_request(params)
        features = data.get('features', [])
        # Attempt 2: first token (likely city) with type hint
        if not features:
            try:
                city_token = dest.split(',')[0].strip()
            except Exception:
                city_token = dest
            params2 = {'text': city_token, 'type': 'city', 'apiKey': api_key, 'limit': 1, 'lang': 'en'}
            data = _do_request(params2)
            features = data.get('features', [])
        if not features:
            return None
        feat = features[0]
        geom = feat.get('geometry', {})
        coords = geom.get('coordinates', [])
        if not coords or len(coords) < 2:
            return None
        lon, lat = float(coords[0]), float(coords[1])
        props = feat.get('properties', {})
        return {
            'lat': lat,
            'lon': lon,
            'city': props.get('city') or props.get('town') or props.get('village'),
            'country': props.get('country_code'),
            'formatted': props.get('formatted'),
            'place_id': props.get('place_id'),
        }
    except Exception:
        return None


def _geoapify_places(lat: float, lon: float, categories: str, api_key: str, limit: int = 20, radius_m: int = 15000, name: str | None = None, place_id: str | None = None):
    params = {
        'categories': categories,
        'filter': f'place:{place_id}' if place_id else f'circle:{lon},{lat},{radius_m}',
        'bias': f'proximity:{lon},{lat}',
        'limit': limit,
        'lang': 'en',
        'apiKey': api_key,
    }
    if name:
        params['name'] = name
    url = f'https://api.geoapify.com/v2/places?{urlencode(params)}'
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.json()


def _km_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import radians, sin, cos, atan2, sqrt
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def _best_time_for_category(category: str) -> str:
    c = category.lower()
    if any(k in c for k in ['museum', 'gallery', 'exhibit']):
        return 'Afternoon'
    if any(k in c for k in ['park', 'garden', 'viewpoint', 'beach']):
        return 'Morning or Sunset'
    if any(k in c for k in ['monument', 'historic', 'landmark', 'temple']):
        return 'Morning'
    if any(k in c for k in ['bar', 'pub', 'night']):
        return 'Evening'
    return 'Daytime'


def _duration_estimate_for_category(category: str) -> str:
    c = category.lower()
    if any(k in c for k in ['museum', 'gallery']):
        return '2-3 hours'
    if any(k in c for k in ['park', 'garden', 'viewpoint', 'beach']):
        return '1-2 hours'
    if any(k in c for k in ['monument', 'landmark', 'temple']):
        return '30-60 min'
    return '1-2 hours'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_attractions(request):
    """Search attractions (tourism) using Geoapify Places API.
    Body: destination (string), limit?, radius_meters?, name?
    """
    try:
        api_key = _get_geoapify_key(request)
        destination = (request.data.get('destination') or '').strip()
        limit = int(request.data.get('limit', 24))
        radius_m = int(request.data.get('radius_meters', 20000))
        name_filter = request.data.get('name')
        if not destination:
            return Response({'success': False, 'error': 'destination is required'}, status=400)

        geo = _geoapify_geocode(destination, api_key)
        if not geo:
            return Response({'success': False, 'error': f"Failed to geocode destination: '{destination}'"}, status=400)

        # Use place filter when available; narrower category avoids 400 issues
        categories = 'tourism.attraction'
        try:
            raw = _geoapify_places(
                geo['lat'], geo['lon'], categories, api_key,
                limit=limit, radius_m=radius_m, name=name_filter, place_id=geo.get('place_id')
            )
        except requests.HTTPError:
            # Fallback to circle filter if place filter fails
            raw = _geoapify_places(
                geo['lat'], geo['lon'], categories, api_key,
                limit=limit, radius_m=radius_m, name=name_filter, place_id=None
            )
        features = raw.get('features', [])
        items = []
        for f in features:
            props = f.get('properties', {})
            fid = props.get('place_id') or props.get('osm_id') or props.get('gid') or props.get('datasource', {}).get('raw', {}).get('id')
            name = props.get('name') or props.get('address_line1') or 'Unknown'
            cats = props.get('categories') or []
            primary_cat = cats[0] if cats else (props.get('category') or 'tourism.attraction')
            lat = props.get('lat') or (f.get('geometry', {}).get('coordinates', [None, None])[1])
            lon = props.get('lon') or (f.get('geometry', {}).get('coordinates', [None, None])[0])
            distance_km = None
            try:
                if lat and lon:
                    distance_km = _km_distance(geo['lat'], geo['lon'], float(lat), float(lon))
            except Exception:
                distance_km = None
            best_time = _best_time_for_category(primary_cat)
            duration = _duration_estimate_for_category(primary_cat)
            items.append({
                'id': str(fid),
                'name': name,
                'type': primary_cat,
                'rating': None,
                'price': 0,
                'duration': duration,
                'distance_km': round(distance_km, 2) if distance_km is not None else None,
                'description': props.get('address_line2') or props.get('formatted') or '',
                'bestTime': best_time,
                'address': props.get('formatted'),
                'lat': lat,
                'lon': lon,
                'raw': props,
            })
        return Response({'success': True, 'data': {'items': items, 'total': len(items), 'center': geo}})
    except requests.HTTPError as e:
        return Response({'success': False, 'error': f'Geoapify HTTP error: {str(e)}'}, status=502)
    except Exception as e:
        return Response({'success': False, 'error': f'Failed to search attractions: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_food(request):
    """Search restaurants/food using Geoapify (catering.* categories).
    Body: destination (string), limit?, radius_meters?, name?
    """
    try:
        api_key = _get_geoapify_key(request)
        destination = (request.data.get('destination') or '').strip()
        limit = int(request.data.get('limit', 24))
        radius_m = int(request.data.get('radius_meters', 15000))
        name_filter = request.data.get('name')
        if not destination:
            return Response({'success': False, 'error': 'destination is required'}, status=400)

        geo = _geoapify_geocode(destination, api_key)
        if not geo:
            return Response({'success': False, 'error': f"Failed to geocode destination: '{destination}'"}, status=400)

        categories = ','.join([
            'catering.restaurant',
            'catering.cafe',
            'catering.fast_food',
            'catering.food_court',
            'catering.bar',
            'catering.biergarten',
        ])
        try:
            raw = _geoapify_places(
                geo['lat'], geo['lon'], categories, api_key,
                limit=limit, radius_m=radius_m, name=name_filter, place_id=geo.get('place_id')
            )
        except requests.HTTPError:
            raw = _geoapify_places(
                geo['lat'], geo['lon'], categories, api_key,
                limit=limit, radius_m=radius_m, name=name_filter, place_id=None
            )
        features = raw.get('features', [])
        items = []
        for f in features:
            props = f.get('properties', {})
            fid = props.get('place_id') or props.get('osm_id') or props.get('gid')
            name = props.get('name') or props.get('address_line1') or 'Unknown'
            cats = props.get('categories') or []
            primary_cat = cats[0] if cats else (props.get('category') or 'catering.restaurant')
            lat = props.get('lat') or (f.get('geometry', {}).get('coordinates', [None, None])[1])
            lon = props.get('lon') or (f.get('geometry', {}).get('coordinates', [None, None])[0])
            distance_km = None
            try:
                if lat and lon:
                    distance_km = _km_distance(geo['lat'], geo['lon'], float(lat), float(lon))
            except Exception:
                distance_km = None
            price_level = props.get('housenumber')  # Not provided; placeholder kept None
            items.append({
                'id': str(fid),
                'name': name,
                'cuisine': primary_cat,
                'priceRange': None,
                'rating': None,
                'distance_km': round(distance_km, 2) if distance_km is not None else None,
                'description': props.get('address_line2') or props.get('formatted') or '',
                'specialDish': None,
                'averageMeal': None,
                'address': props.get('formatted'),
                'lat': lat,
                'lon': lon,
                'raw': props,
            })
        return Response({'success': True, 'data': {'items': items, 'total': len(items), 'center': geo}})
    except requests.HTTPError as e:
        return Response({'success': False, 'error': f'Geoapify HTTP error: {str(e)}'}, status=502)
    except Exception as e:
        return Response({'success': False, 'error': f'Failed to search food: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_transport(request):
    """Search transport-related places (public_transport.*, bicycle, car rental) using Geoapify.
    Body: destination (string), limit?, radius_meters?
    """
    try:
        api_key = _get_geoapify_key(request)
        destination = (request.data.get('destination') or '').strip()
        limit = int(request.data.get('limit', 24))
        # Use smaller default radius as per working sample
        radius_m = int(request.data.get('radius_meters', 5000))
        if not destination:
            return Response({'success': False, 'error': 'destination is required'}, status=400)

        geo = _geoapify_geocode(destination, api_key)
        if not geo:
            return Response({'success': False, 'error': f"Failed to geocode destination: '{destination}'"}, status=400)

        # Always use circle filter with proximity bias per working method
        categories = 'public_transport'
        params = {
            'categories': categories,
            'filter': f'circle:{geo["lon"]},{geo["lat"]},{radius_m}',
            'bias': f'proximity:{geo["lon"]},{geo["lat"]}',
            'lang': 'en',
            'limit': limit,
            'apiKey': api_key,
        }
        url = f'https://api.geoapify.com/v2/places?{urlencode(params)}'
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        raw = r.json()
        features = raw.get('features', [])
        items = []
        seen_ids = set()
        seen_keys = set()
        for f in features:
            props = f.get('properties', {})
            fid = props.get('place_id') or props.get('osm_id') or props.get('gid')
            name = props.get('name') or props.get('address_line1') or 'Unnamed stop'
            cats = props.get('categories') or []
            primary_cat = cats[0] if cats else (props.get('category') or 'public_transport')
            lat = props.get('lat') or (f.get('geometry', {}).get('coordinates', [None, None])[1])
            lon = props.get('lon') or (f.get('geometry', {}).get('coordinates', [None, None])[0])
            distance_km = None
            try:
                if lat and lon:
                    distance_km = _km_distance(geo['lat'], geo['lon'], float(lat), float(lon))
            except Exception:
                distance_km = None
            # De-duplicate by place_id first, then by name+address+coords signature
            sig_id = str(fid) if fid is not None else None
            if sig_id and sig_id in seen_ids:
                continue
            addr = props.get('formatted') or ''
            try:
                lat_q = round(float(lat), 5) if lat is not None else None
                lon_q = round(float(lon), 5) if lon is not None else None
            except Exception:
                lat_q, lon_q = lat, lon
            sig_key = f"{(name or '').strip().lower()}|{addr.strip().lower()}|{lat_q}|{lon_q}"
            if sig_key in seen_keys:
                continue
            if sig_id:
                seen_ids.add(sig_id)
            seen_keys.add(sig_key)
            items.append({
                'id': str(fid),
                'name': name,
                'type': primary_cat,
                'coverage': props.get('suburb') or props.get('city') or '',
                'convenience': None,
                'features': cats,
                'address': props.get('formatted'),
                'distance_km': round(distance_km, 2) if distance_km is not None else None,
                'lat': lat,
                'lon': lon,
                'raw': props,
            })
        return Response({'success': True, 'data': {'items': items, 'total': len(items), 'center': geo}})
    except requests.HTTPError as e:
        return Response({'success': False, 'error': f'Geoapify HTTP error: {str(e)}'}, status=502)
    except Exception as e:
        return Response({'success': False, 'error': f'Failed to search transport: {str(e)}'}, status=500)
