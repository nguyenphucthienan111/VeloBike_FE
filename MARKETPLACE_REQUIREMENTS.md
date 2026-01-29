# 🏪 Marketplace Page Requirements - Role BUYER

## 📌 Overview
Trang Marketplace là nơi người dùng (Buyers) có thể duyệt, tìm kiếm, và xem chi tiết các xe đạp được bán.

---

## 🎨 UI/UX Components

### **1. Filters Sidebar (Left)**
- **Category Filter** (Radio buttons)
  - ALL
  - ROAD
  - MTB
  - GRAVEL
  - TRIATHLON
  - E_BIKE

- **Brand Filter** (Checkboxes)
  - Scrollable list of brands
  - Multiple selection allowed

- **Price Range Filter**
  - Min price input
  - Max price input
  - Apply button

### **2. Header & Sort Section**
- Title: "Marketplace (X bikes)"
- Sort dropdown
  - Sort by: Recommended
  - Price: Low to High
  - Price: High to Low
  - Newest Listed

### **3. Product Grid**
- Grid layout: 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop)
- BikeCard component for each listing
- Empty state message: "No bikes found matching your criteria"
- Clear filters button

### **4. Pagination**
- Page numbers at bottom
- Current page highlighted

---

## 🔌 Backend APIs Required

### **1️⃣ Get All Listings**
```
Endpoint: GET /api/listings
Parameters:
  - type: string (ROAD | MTB | GRAVEL | TRIATHLON | E_BIKE)
  - brand: string
  - minPrice: number
  - maxPrice: number
  - page: number (for pagination)
  - limit: number (default 12)

Response:
{
  success: boolean,
  count: number,
  data: [{
    id: string,
    title: string,
    type: string,
    generalInfo: {
      brand: string,
      model: string,
      year: number,
      size: string,
      condition: string
    },
    pricing: {
      amount: number,
      currency: string,
      originalPrice?: number
    },
    media: {
      thumbnails: [string]
    },
    sellerId: {
      fullName: string,
      reputation: number,
      badge?: string,
      planType?: string
    },
    location: {
      address: string
    },
    views: number,
    createdAt: string,
    boostedUntil?: string
  }]
}
```

### **2️⃣ Advanced Search**
```
Endpoint: GET /api/listings/search/advanced
Parameters:
  - keyword: string
  - type: string
  - brand: string
  - minPrice: number
  - maxPrice: number
  - sortBy: newest | price_asc | price_desc | views
  - page: number
  - limit: number

Response: Same as getAll
```

### **3️⃣ Get Search Facets (For dynamic filters)**
```
Endpoint: GET /api/listings/search/facets
Response:
{
  success: boolean,
  data: {
    types: [string],
    brands: [string],
    priceRange: { min: number, max: number }
  }
}
```

### **4️⃣ Get Listing Details**
```
Endpoint: GET /api/listings/:id
Response:
{
  success: boolean,
  data: {
    id: string,
    title: string,
    description: string,
    type: string,
    generalInfo: { ... },
    specs: { ... },
    geometry: { ... },
    pricing: { ... },
    media: { ... },
    location: { ... },
    sellerId: { ... },
    views: number,
    createdAt: string,
    status: string
  }
}
```

### **5️⃣ Increment View Count**
```
Endpoint: PUT /api/listings/:id/view
```

### **6️⃣ Get Featured Listings**
```
Endpoint: GET /api/listings/featured?limit=10
Response: Same as getAll (only PREMIUM sellers)
```

### **7️⃣ Get Search Suggestions**
```
Endpoint: GET /api/listings/search/suggestions?q=keyword&limit=10
Response:
{
  success: boolean,
  data: [string]
}
```

### **8️⃣ Nearby Search (Geolocation)**
```
Endpoint: GET /api/listings/nearby
Parameters:
  - lat: number (required)
  - lng: number (required)
  - radius: number (default 10 km)
  - type: string
  - page: number
  - limit: number

Response: Same as getAll
```

### **9️⃣ Bike Fit Calculator**
```
Endpoint: POST /api/listings/fit-calculator
Body: {
  riderHeight: number (cm),
  riderInseam: number (cm),
  riderReach?: number (mm),
  listingId?: string
}

Response:
{
  success: boolean,
  data: {
    recommendations: [string],
    compatibleListings: [{...}]
  }
}
```

---

## 📊 Frontend Implementation Steps

### **Phase 1: Basic Listing Display** ✅
- [ ] Fetch all listings from API
- [ ] Display in grid using BikeCard component
- [ ] Add pagination
- [ ] Show empty state

### **Phase 2: Filters Implementation**
- [ ] Get facets from API (brands, types, price range)
- [ ] Implement category radio buttons
- [ ] Implement brand checkboxes
- [ ] Implement price range filter
- [ ] Update listings on filter change
- [ ] Add "Clear all filters" functionality

### **Phase 3: Search & Sort**
- [ ] Implement search input
- [ ] Implement sort dropdown (Recommended, Price ASC/DESC, Newest)
- [ ] Call advancedSearch API with all parameters
- [ ] Display result count

### **Phase 4: Detail Page**
- [ ] Create ProductDetail.tsx page
- [ ] Fetch listing by ID
- [ ] Display full details (images, specs, seller info)
- [ ] Add to cart / contact seller buttons
- [ ] Increment view count on page load

### **Phase 5: Enhanced Features** (Optional)
- [ ] Search autocomplete/suggestions
- [ ] Geolocation nearby search
- [ ] Bike fit calculator
- [ ] Save searches
- [ ] Wishlist integration

---

## 🎯 Current Frontend State

### **Components to Update/Create:**
1. **Marketplace.tsx** - Main page (currently uses MOCK_LISTINGS)
2. **BikeCard.tsx** - Individual bike card (already exists)
3. **ProductDetail.tsx** - Detail page (needs implementation)
4. **constants.ts** - Add API endpoints

### **Current Mock Data:**
- Using MOCK_LISTINGS from constants.ts
- Using BRANDS array

---

## 🔗 API Base URL

```
Backend URL: http://localhost:5000
API Base: /api
Listings endpoint: /api/listings
```

---

## 📝 State Management

### **Marketplace Page State:**
```typescript
const [listings, setListings] = useState<Listing[]>([]);
const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
const [selectedType, setSelectedType] = useState<BikeType | 'ALL'>('ALL');
const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000000]);
const [sortBy, setSortBy] = useState('recommended');
const [searchQuery, setSearchQuery] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## 🛒 Wishlist Integration

```typescript
// Add to/remove from wishlist
const toggleWishlist = (listingId: string) => {
  if (wishlisted.includes(listingId)) {
    removeFromWishlist(listingId);
  } else {
    addToWishlist(listingId);
  }
};
```

---

## 📱 Responsive Design

- **Mobile:** 1 column grid, filters in drawer/accordion
- **Tablet:** 2 columns
- **Desktop:** 3 columns with sidebar filters

---

## 🔐 Authentication Context

- Buyer should be authenticated to:
  - Add to cart
  - Add to wishlist
  - Save searches
  - Contact seller

---

## 🎨 Design System

### **Colors:**
- Primary: Black (#000000)
- Accent: Gray (#4B5563)
- Background: Light gray (#F5F5F5)
- Borders: Gray (#E0E0E0)

### **Typography:**
- Heading: Bold, large
- Filter labels: Bold, small
- Card titles: Bold, medium
- Prices: Bold, accent color

### **Spacing:**
- Sidebar width: 16rem (64px * 4)
- Card gap: 1.5rem (24px)
- Section padding: 2rem (32px)

---

## ✅ Success Criteria

1. ✅ All listings display correctly from API
2. ✅ Filters work and update results
3. ✅ Search functionality working
4. ✅ Sort dropdown changes results
5. ✅ Detail page loads correct listing
6. ✅ Pagination working
7. ✅ Mobile responsive
8. ✅ No console errors
9. ✅ Loading states visible
10. ✅ Error handling for API failures

---

## 🐛 Known Issues to Fix

1. Currently using MOCK_LISTINGS - need real API integration
2. Price range filter not applying
3. Pagination not implemented
4. Search not connected to API
5. Missing loading states
6. Missing error handling

---

## 📅 Priority Order

1. **HIGH:** Basic listing display + filters
2. **HIGH:** Search & sort
3. **MEDIUM:** Detail page
4. **MEDIUM:** Pagination
5. **LOW:** Advanced features (geolocation, fit calc)

---

## 🚀 Next Steps

1. Setup API constants in `constants.ts`
2. Create custom hook `useListings` for API calls
3. Update `Marketplace.tsx` to use real API
4. Create `ProductDetail.tsx` page
5. Add loading/error states
6. Test on different screen sizes

---

**Last Updated:** 2026-01-24
**Status:** In Progress
