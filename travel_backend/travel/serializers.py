from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, Trip, TripItem, TripBudget, TripItinerary, UserPreference, TripPlanningStage, LiveItineraryItem

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')

        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 
                 'date_of_birth', 'profile_picture', 'preferences', 'created_at', 'updated_at']

class TripPlanningStageSerializer(serializers.ModelSerializer):
    stage_type_display = serializers.CharField(source='get_stage_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    is_skipped = serializers.BooleanField(read_only=True)
    has_selections = serializers.BooleanField(read_only=True)

    class Meta:
        model = TripPlanningStage
        fields = ['id', 'trip', 'stage_type', 'stage_type_display', 'status', 'status_display',
                 'selected_items', 'ai_options', 'stage_preferences', 'started_at', 'completed_at',
                 'notes', 'is_completed', 'is_skipped', 'has_selections', 'created_at', 'updated_at']
        read_only_fields = ['trip']

class TripPlanningStageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripPlanningStage
        fields = ['stage_type', 'selected_items', 'ai_options', 'stage_preferences', 'notes']

    def create(self, validated_data):
        trip_id = self.context['trip_id']
        validated_data['trip_id'] = trip_id
        return TripPlanningStage.objects.create(**validated_data)

class TripPlanningStageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripPlanningStage
        fields = ['status', 'selected_items', 'ai_options', 'stage_preferences', 'notes']

class TripItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripItem
        fields = ['id', 'item_type', 'name', 'description', 'price', 'currency', 
                 'booking_reference', 'external_id', 'metadata', 'is_selected', 
                 'created_at', 'updated_at']

class TripBudgetSerializer(serializers.ModelSerializer):
    remaining_budget = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    spent_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = TripBudget
        fields = ['id', 'total_budget', 'spent_amount', 'currency', 'budget_breakdown',
                 'remaining_budget', 'spent_percentage', 'created_at', 'updated_at']

class TripItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = TripItinerary
        fields = ['id', 'day_plans', 'notes', 'created_at', 'updated_at']

class TripSerializer(serializers.ModelSerializer):
    items = TripItemSerializer(many=True, read_only=True)
    budget = TripBudgetSerializer(source='budget_info', read_only=True)
    itinerary = TripItinerarySerializer(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'user_username', 'title', 'destination', 'description', 
                 'start_date', 'end_date', 'budget', 'travelers', 'travel_style', 
                 'status', 'image_url', 'duration_days', 'items', 'budget', 
                 'itinerary', 'created_at', 'updated_at']
        read_only_fields = ['user']

class TripCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'title', 'destination', 'description', 'start_date', 'end_date', 
                 'budget', 'travelers', 'travel_style', 'image_url']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        trip = Trip.objects.create(**validated_data)
        
        # Create associated budget
        TripBudget.objects.create(trip=trip, total_budget=trip.budget)
        
        # Create associated itinerary
        TripItinerary.objects.create(trip=trip)
        
        return trip

class TripItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripItem
        fields = ['item_type', 'name', 'description', 'price', 'currency', 
                 'booking_reference', 'external_id', 'metadata', 'is_selected']

    def create(self, validated_data):
        trip_id = self.context['trip_id']
        validated_data['trip_id'] = trip_id
        return TripItem.objects.create(**validated_data)

class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['id', 'preferred_destinations', 'preferred_activities', 
                 'budget_range', 'travel_style_preferences', 'dietary_restrictions', 
                 'accessibility_needs', 'created_at', 'updated_at']

class TripUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['title', 'destination', 'description', 'start_date', 'end_date', 
                 'budget', 'travelers', 'travel_style', 'status', 'image_url']

class TripItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripItem
        fields = ['name', 'description', 'price', 'currency', 'booking_reference', 
                 'external_id', 'metadata', 'is_selected']

class LiveItineraryItemSerializer(serializers.ModelSerializer):
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = LiveItineraryItem
        fields = ['id', 'trip', 'day_number', 'item_type', 'item_type_display', 'title', 'description',
                 'planned_start_time', 'planned_end_time', 'actual_start_time', 'actual_end_time',
                 'location', 'address', 'is_completed', 'is_skipped', 'completion_notes',
                 'price', 'currency', 'booking_reference', 'external_id', 'metadata',
                 'is_overdue', 'duration_minutes', 'created_at', 'updated_at', 'completed_at']
        read_only_fields = ['trip']

class LiveItineraryItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveItineraryItem
        fields = ['day_number', 'item_type', 'title', 'description', 'planned_start_time', 
                 'planned_end_time', 'location', 'address', 'price', 'currency', 
                 'booking_reference', 'external_id', 'metadata']

    def create(self, validated_data):
        trip_id = self.context['trip_id']
        validated_data['trip_id'] = trip_id
        return LiveItineraryItem.objects.create(**validated_data)

class LiveItineraryItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveItineraryItem
        fields = ['title', 'description', 'planned_start_time', 'planned_end_time', 
                 'actual_start_time', 'actual_end_time', 'location', 'address', 
                 'is_completed', 'is_skipped', 'completion_notes', 'price', 'currency', 
                 'booking_reference', 'external_id', 'metadata']
