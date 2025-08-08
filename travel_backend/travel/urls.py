from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    
    # User profile and preferences
    path('user/profile/', views.user_profile, name='user_profile'),
    path('user/preferences/', views.user_preferences, name='user_preferences'),
    path('user/dashboard/', views.user_dashboard, name='user_dashboard'),
    
    # Trip endpoints
    path('trips/', views.TripListCreateView.as_view(), name='trip_list_create'),
    path('trips/<uuid:pk>/', views.TripDetailView.as_view(), name='trip_detail'),
    path('trips/<uuid:trip_id>/summary/', views.trip_summary, name='trip_summary'),
    
    # Trip items endpoints
    path('trips/<uuid:trip_id>/items/', views.TripItemListView.as_view(), name='trip_item_list'),
    path('trips/<uuid:trip_id>/items/<uuid:pk>/', views.TripItemDetailView.as_view(), name='trip_item_detail'),
    path('trips/<uuid:trip_id>/items/<uuid:item_id>/select/', views.select_trip_item, name='select_trip_item'),
    
    # Trip budget and itinerary
    path('trips/<uuid:trip_id>/budget/', views.trip_budget, name='trip_budget'),
    path('trips/<uuid:trip_id>/itinerary/', views.trip_itinerary, name='trip_itinerary'),
    
    # Trip planning stages endpoints
    path('trips/<uuid:trip_id>/planning-stages/', views.TripPlanningStageListView.as_view(), name='trip_planning_stage_list'),
    path('trips/<uuid:trip_id>/planning-stages/<uuid:pk>/', views.TripPlanningStageDetailView.as_view(), name='trip_planning_stage_detail'),
    path('trips/<uuid:trip_id>/planning-progress/', views.trip_planning_progress, name='trip_planning_progress'),
    path('trips/<uuid:trip_id>/planning-stages/<str:stage_type>/update/', views.update_planning_stage, name='update_planning_stage'),
    path('trips/<uuid:trip_id>/planning-stages/<str:stage_type>/complete/', views.mark_stage_completed, name='mark_stage_completed'),
    path('trips/<uuid:trip_id>/planning-stages/<str:stage_type>/skip/', views.mark_stage_skipped, name='mark_stage_skipped'),
    
    # Live itinerary endpoints
    path('trips/<uuid:trip_id>/live-itinerary/', views.trip_live_itinerary, name='trip_live_itinerary'),
    path('trips/<uuid:trip_id>/live-itinerary/items/', views.LiveItineraryItemListView.as_view(), name='live_itinerary_item_list'),
    path('trips/<uuid:trip_id>/live-itinerary/items/<uuid:pk>/', views.LiveItineraryItemDetailView.as_view(), name='live_itinerary_item_detail'),
    path('trips/<uuid:trip_id>/live-itinerary/items/<uuid:item_id>/complete/', views.mark_itinerary_item_completed, name='mark_itinerary_item_completed'),
    path('trips/<uuid:trip_id>/live-itinerary/items/<uuid:item_id>/skip/', views.mark_itinerary_item_skipped, name='mark_itinerary_item_skipped'),
    path('trips/<uuid:trip_id>/live-itinerary/items/<uuid:item_id>/times/', views.update_itinerary_item_times, name='update_itinerary_item_times'),

    # Flight search endpoints
    path('flights/search/', views.search_flights_ai, name='search_flights_ai'),
    path('flights/airports/', views.get_airport_suggestions, name='get_airport_suggestions'),

    # Hotel search endpoints
    path('hotels/search/', views.search_hotels_ai, name='search_hotels_ai'),
]
