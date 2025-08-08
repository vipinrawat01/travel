from django.contrib import admin
from .models import UserProfile, Trip, TripItem, TripBudget, TripItinerary, UserPreference, TripPlanningStage, LiveItineraryItem

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'created_at']
    search_fields = ['user__username', 'user__email']
    list_filter = ['created_at']

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'destination', 'start_date', 'end_date', 'status', 'budget']
    list_filter = ['status', 'travel_style', 'start_date', 'created_at']
    search_fields = ['title', 'destination', 'user__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'start_date'

@admin.register(TripItem)
class TripItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'trip', 'item_type', 'price', 'is_selected']
    list_filter = ['item_type', 'is_selected', 'created_at']
    search_fields = ['name', 'trip__title']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(TripBudget)
class TripBudgetAdmin(admin.ModelAdmin):
    list_display = ['trip', 'total_budget', 'spent_amount', 'remaining_budget', 'spent_percentage']
    readonly_fields = ['remaining_budget', 'spent_percentage']
    search_fields = ['trip__title']

@admin.register(TripItinerary)
class TripItineraryAdmin(admin.ModelAdmin):
    list_display = ['trip', 'created_at']
    search_fields = ['trip__title']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(TripPlanningStage)
class TripPlanningStageAdmin(admin.ModelAdmin):
    list_display = ['trip', 'stage_type', 'status', 'started_at', 'completed_at', 'has_selections']
    list_filter = ['stage_type', 'status', 'started_at', 'completed_at']
    search_fields = ['trip__title', 'trip__destination']
    readonly_fields = ['id', 'started_at', 'created_at', 'updated_at', 'is_completed', 'is_skipped', 'has_selections']
    date_hierarchy = 'started_at'
    
    def has_selections(self, obj):
        return obj.has_selections
    has_selections.boolean = True
    has_selections.short_description = 'Has Selections'

@admin.register(LiveItineraryItem)
class LiveItineraryItemAdmin(admin.ModelAdmin):
    list_display = ['trip', 'day_number', 'item_type', 'title', 'is_completed', 'is_skipped', 'planned_start_time']
    list_filter = ['item_type', 'is_completed', 'is_skipped', 'day_number']
    search_fields = ['trip__title', 'title', 'description', 'location']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at', 'is_overdue', 'duration_minutes']
    ordering = ['trip', 'day_number', 'planned_start_time']
    
    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Overdue'
    
    def duration_minutes(self, obj):
        return obj.duration_minutes
    duration_minutes.short_description = 'Duration (min)'
