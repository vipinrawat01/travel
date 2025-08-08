from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Trip(models.Model):
    TRIP_STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    TRAVEL_STYLE_CHOICES = [
        ('luxury', 'Luxury'),
        ('adventure', 'Adventure'),
        ('cultural', 'Cultural'),
        ('culinary', 'Culinary'),
        ('budget', 'Budget'),
        ('family', 'Family'),
        ('business', 'Business'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    title = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    travelers = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, default='cultural')
    status = models.CharField(max_length=20, choices=TRIP_STATUS_CHOICES, default='planned')
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.destination}"

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days

class TripItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('flight', 'Flight'),
        ('hotel', 'Hotel'),
        ('attraction', 'Attraction'),
        ('restaurant', 'Restaurant'),
        ('transport', 'Transport'),
        ('activity', 'Activity'),
        ('event', 'Event'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    booking_reference = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_selected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['item_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_item_type_display()})"

class TripBudget(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name='budget_info')
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    spent_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    budget_breakdown = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Budget for {self.trip.title}"

    @property
    def remaining_budget(self):
        return self.total_budget - self.spent_amount

    @property
    def spent_percentage(self):
        if self.total_budget > 0:
            return (self.spent_amount / self.total_budget) * 100
        return 0

class TripItinerary(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name='itinerary')
    day_plans = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Itinerary for {self.trip.title}"

class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    preferred_destinations = models.JSONField(default=list, blank=True)
    preferred_activities = models.JSONField(default=list, blank=True)
    budget_range = models.JSONField(default=dict, blank=True)
    travel_style_preferences = models.JSONField(default=list, blank=True)
    dietary_restrictions = models.JSONField(default=list, blank=True)
    accessibility_needs = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"

class TripPlanningStage(models.Model):
    STAGE_CHOICES = [
        ('flight', 'Flight'),
        ('hotel', 'Hotel'),
        ('attractions', 'Attractions'),
        ('food', 'Food'),
        ('transport', 'Transport'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='planning_stages')
    stage_type = models.CharField(max_length=20, choices=STAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Store the selected items for this stage
    selected_items = models.JSONField(default=list, blank=True)
    
    # Store AI-generated options for this stage
    ai_options = models.JSONField(default=list, blank=True)
    
    # Store user preferences/settings for this stage
    stage_preferences = models.JSONField(default=dict, blank=True)
    
    # Track when the stage was started and completed
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Additional metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['trip', 'stage_type']
        ordering = ['trip', 'stage_type']

    def __str__(self):
        return f"{self.trip.title} - {self.get_stage_type_display()} ({self.get_status_display()})"

    def mark_completed(self):
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

    def mark_in_progress(self):
        self.status = 'in_progress'
        self.save()

    def mark_skipped(self):
        from django.utils import timezone
        self.status = 'skipped'
        self.completed_at = timezone.now()
        self.save()

    @property
    def is_completed(self):
        return self.status == 'completed'

    @property
    def is_skipped(self):
        return self.status == 'skipped'

    @property
    def has_selections(self):
        return len(self.selected_items) > 0

class LiveItineraryItem(models.Model):
    """Model for individual itinerary items that can be checked off and adjusted"""
    ITEM_TYPE_CHOICES = [
        ('flight', 'Flight'),
        ('hotel', 'Hotel'),
        ('attraction', 'Attraction'),
        ('restaurant', 'Restaurant'),
        ('transport', 'Transport'),
        ('activity', 'Activity'),
        ('event', 'Event'),
        ('break', 'Break'),
        ('meal', 'Meal'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='live_itinerary_items')
    day_number = models.IntegerField(default=1)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Time management
    planned_start_time = models.TimeField(blank=True, null=True)
    planned_end_time = models.TimeField(blank=True, null=True)
    actual_start_time = models.TimeField(blank=True, null=True)
    actual_end_time = models.TimeField(blank=True, null=True)
    
    # Location
    location = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    
    # Status and completion
    is_completed = models.BooleanField(default=False)
    is_skipped = models.BooleanField(default=False)
    completion_notes = models.TextField(blank=True)
    
    # Metadata
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    booking_reference = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['trip', 'day_number', 'planned_start_time']
        unique_together = ['trip', 'day_number', 'title']

    def __str__(self):
        return f"Day {self.day_number}: {self.title}"

    def mark_completed(self):
        from django.utils import timezone
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

    def mark_skipped(self):
        self.is_skipped = True
        self.save()

    def update_times(self, actual_start_time=None, actual_end_time=None):
        if actual_start_time:
            self.actual_start_time = actual_start_time
        if actual_end_time:
            self.actual_end_time = actual_end_time
        self.save()

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.planned_end_time and not self.is_completed:
            now = timezone.now().time()
            return now > self.planned_end_time
        return False

    @property
    def duration_minutes(self):
        if self.planned_start_time and self.planned_end_time:
            start = self.planned_start_time
            end = self.planned_end_time
            return (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
        return 0
