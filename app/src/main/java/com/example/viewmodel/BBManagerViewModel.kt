package com.example.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BBManagerViewModel : ViewModel() {

  private val branches = listOf(
    Branch(
      id = "branch_dt_01",
      name = "Downtown Flagship",
      code = "DT-01",
      address = "402 Market Street, Financial District",
      phone = "+1 (555) 902-1100",
      isActive = true
    ),
    Branch(
      id = "branch_ub_02",
      name = "Uptown Bistro & Pickup",
      code = "UB-02",
      address = "710 Broadway Ave, Northside",
      phone = "+1 (555) 902-2200",
      isActive = false
    ),
    Branch(
      id = "branch_we_03",
      name = "Westside Express Pod",
      code = "WE-03",
      address = "1590 West Ocean Blvd",
      phone = "+1 (555) 902-3300",
      isActive = false
    )
  )

  private val _availableBranches = MutableStateFlow(branches)
  val availableBranches: StateFlow<List<Branch>> = _availableBranches.asStateFlow()

  private val _activeBranch = MutableStateFlow(branches[0])
  val activeBranch: StateFlow<Branch> = _activeBranch.asStateFlow()

  private val _currentUser = MutableStateFlow<StaffUser?>(
    StaffUser(
      id = "usr_01",
      email = "manager.downtown@bbmanager.internal",
      name = "Alex Vance",
      role = "Kitchen Lead & Manager",
      branchId = "branch_dt_01",
      branchName = "Downtown Flagship"
    )
  )
  val currentUser: StateFlow<StaffUser?> = _currentUser.asStateFlow()

  private val _isLoggedIn = MutableStateFlow(true)
  val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

  private val _connectionStatus = MutableStateFlow(ConnectionStatus.LIVE)
  val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

  private val _outboxQueue = MutableStateFlow<List<OutboxItem>>(emptyList())
  val outboxQueue: StateFlow<List<OutboxItem>> = _outboxQueue.asStateFlow()

  private val _orders = MutableStateFlow<List<Order>>(emptyList())
  val orders: StateFlow<List<Order>> = _orders.asStateFlow()

  private val _selectedOrderFilter = MutableStateFlow<OrderStatus?>(null)
  val selectedOrderFilter: StateFlow<OrderStatus?> = _selectedOrderFilter.asStateFlow()

  private val _menuItems = MutableStateFlow<List<MenuItem>>(emptyList())
  val menuItems: StateFlow<List<MenuItem>> = _menuItems.asStateFlow()

  private val _selectedMenuCategory = MutableStateFlow("All")
  val selectedMenuCategory: StateFlow<String> = _selectedMenuCategory.asStateFlow()

  private val _menuSearchQuery = MutableStateFlow("")
  val menuSearchQuery: StateFlow<String> = _menuSearchQuery.asStateFlow()

  private val _selectedOrderForDetail = MutableStateFlow<Order?>(null)
  val selectedOrderForDetail: StateFlow<Order?> = _selectedOrderForDetail.asStateFlow()

  // Dining Tables & Reservations
  private val _diningTables = MutableStateFlow<List<DiningTable>>(emptyList())
  val diningTables: StateFlow<List<DiningTable>> = _diningTables.asStateFlow()

  private val _reservations = MutableStateFlow<List<Reservation>>(emptyList())
  val reservations: StateFlow<List<Reservation>> = _reservations.asStateFlow()

  // Store Operations Configuration
  private val _storeConfig = MutableStateFlow(StoreOperationsConfig())
  val storeConfig: StateFlow<StoreOperationsConfig> = _storeConfig.asStateFlow()

  init {
    seedInitialData()
  }

  private fun seedInitialData() {
    val now = System.currentTimeMillis()
    _orders.value = listOf(
      Order(
        id = "ord_101",
        orderNumber = "204",
        branchId = "branch_dt_01",
        customerName = "Marcus Sterling",
        customerPhone = "+1 (555) 234-8901",
        status = OrderStatus.NEW,
        pickupCode = "8291",
        totalAmount = 34.50,
        createdAtMillis = now - (4 * 60 * 1000),
        notes = "Extra napkins and fork",
        items = listOf(
          OrderItem("i1", "Smash Truffle Double Burger", 2, 14.0),
          OrderItem("i2", "Parmesan Herb Crinkle Fries", 1, 6.50)
        )
      ),
      Order(
        id = "ord_102",
        orderNumber = "205",
        branchId = "branch_dt_01",
        customerName = "Elena Rostova",
        customerPhone = "+1 (555) 876-1234",
        status = OrderStatus.PREPARING,
        pickupCode = "4410",
        totalAmount = 22.00,
        createdAtMillis = now - (14 * 60 * 1000),
        items = listOf(
          OrderItem("i3", "Crispy Nashville Hot Chicken Bun", 1, 13.50),
          OrderItem("i4", "House Mango Iced Tea", 2, 4.25)
        )
      ),
      Order(
        id = "ord_103",
        orderNumber = "206",
        branchId = "branch_dt_01",
        customerName = "David K.",
        customerPhone = "+1 (555) 432-9087",
        status = OrderStatus.READY,
        pickupCode = "9120",
        totalAmount = 16.75,
        createdAtMillis = now - (25 * 60 * 1000),
        items = listOf(
          OrderItem("i5", "Smoked Bacon Avocado Melt", 1, 12.00),
          OrderItem("i6", "Loaded Queso Dip & Crisps", 1, 4.75)
        )
      ),
      Order(
        id = "ord_104",
        orderNumber = "207",
        branchId = "branch_dt_01",
        customerName = "Sarah Jenkins",
        customerPhone = "+1 (555) 789-0123",
        status = OrderStatus.COMPLETED,
        pickupCode = "1098",
        totalAmount = 48.00,
        createdAtMillis = now - (55 * 60 * 1000),
        items = listOf(
          OrderItem("i7", "Family Combo Platter (4 Burgers)", 1, 42.00),
          OrderItem("i8", "Salted Caramel Milkshake", 1, 6.00)
        )
      )
    )

    _selectedOrderForDetail.value = _orders.value.firstOrNull()

    _menuItems.value = listOf(
      MenuItem(
        id = "m_01",
        branchId = "branch_dt_01",
        name = "Smash Truffle Double Burger",
        category = "Burgers",
        description = "Double Angus smashed patties, black truffle aioli, aged cheddar on brioche.",
        price = 14.00,
        inStock = true,
        preparationMinutes = 12,
        modifiers = listOf("Extra Truffle Mayo", "Brioche Bun", "Gluten-Free Bun")
      ),
      MenuItem(
        id = "m_02",
        branchId = "branch_dt_01",
        name = "Crispy Nashville Hot Chicken Bun",
        category = "Burgers",
        description = "Cayenne-dusted fried thigh, dill pickles, vinegar slaw, house cayenne mayo.",
        price = 13.50,
        inStock = true,
        preparationMinutes = 10,
        modifiers = listOf("Mild Heat", "X-Hot Heat", "Extra Pickles")
      ),
      MenuItem(
        id = "m_03",
        branchId = "branch_dt_01",
        name = "Smoked Bacon Avocado Melt",
        category = "Burgers",
        description = "Applewood smoked bacon, Hass avocado, gouda cheese, toasted sourdough.",
        price = 12.00,
        inStock = false,
        preparationMinutes = 9
      ),
      MenuItem(
        id = "m_04",
        branchId = "branch_dt_01",
        name = "Parmesan Herb Crinkle Fries",
        category = "Sides",
        description = "Crispy crinkle cut tossed in shaved pecorino, parsley, and garlic oil.",
        price = 6.50,
        inStock = true,
        preparationMinutes = 6
      ),
      MenuItem(
        id = "m_05",
        branchId = "branch_dt_01",
        name = "Loaded Queso Dip & Crisps",
        category = "Sides",
        description = "Warm poblano three-cheese fondue with house tortilla crisps.",
        price = 4.75,
        inStock = true,
        preparationMinutes = 5
      ),
      MenuItem(
        id = "m_06",
        branchId = "branch_dt_01",
        name = "House Mango Iced Tea",
        category = "Beverages",
        description = "Cold-brewed Ceylon black tea infused with natural alphonso mango nectar.",
        price = 4.25,
        inStock = true,
        preparationMinutes = 2
      ),
      MenuItem(
        id = "m_07",
        branchId = "branch_dt_01",
        name = "Salted Caramel Milkshake",
        category = "Beverages",
        description = "Hand-spun Madagascar vanilla gelato with sea-salt butterscotch ribbons.",
        price = 6.00,
        inStock = false,
        preparationMinutes = 4
      )
    )

    _diningTables.value = listOf(
      DiningTable("tbl_01", "branch_dt_01", "T-01", "Window Booth Alpha", 4, true, "Main Dining"),
      DiningTable("tbl_02", "branch_dt_01", "T-02", "Center High-Top", 2, false, "Main Dining"),
      DiningTable("tbl_03", "branch_dt_01", "T-03", "Patio Garden Bench", 6, true, "Patio"),
      DiningTable("tbl_04", "branch_dt_01", "T-04", "Patio Pergola Table", 4, false, "Patio"),
      DiningTable("tbl_05", "branch_dt_01", "BAR-01", "Counter Stools East", 2, true, "Bar"),
      DiningTable("tbl_06", "branch_dt_01", "BAR-02", "Counter Stools West", 2, true, "Bar")
    )

    _reservations.value = listOf(
      Reservation("res_101", "branch_dt_01", "Jonathan Vance", "+1 (555) 781-9921", 4, "6:30 PM (In 20m)", "T-01", ReservationStatus.UPCOMING, "High chair needed"),
      Reservation("res_102", "branch_dt_01", "Melissa Howard", "+1 (555) 349-8812", 2, "7:00 PM (In 50m)", "T-03", ReservationStatus.UPCOMING, "Quiet booth requested"),
      Reservation("res_103", "branch_dt_01", "Derrick Campbell", "+1 (555) 912-3301", 6, "6:15 PM", "T-04", ReservationStatus.ARRIVED, "Separate checks"),
      Reservation("res_104", "branch_dt_01", "Grace Lin", "+1 (555) 230-1199", 3, "5:45 PM", "T-02", ReservationStatus.SEATED)
    )
  }

  fun login(email: String, branchCode: String) {
    val matchedBranch = branches.find { it.code.equals(branchCode.trim(), ignoreCase = true) }
      ?: branches.first()
    _activeBranch.value = matchedBranch
    _currentUser.value = StaffUser(
      id = "usr_${System.currentTimeMillis() % 1000}",
      email = email,
      name = email.substringBefore("@").replace(".", " ").capitalizeWords(),
      role = "Floor Operations Staff",
      branchId = matchedBranch.id,
      branchName = matchedBranch.name
    )
    _isLoggedIn.value = true
  }

  fun logout() {
    _isLoggedIn.value = false
    _currentUser.value = null
  }

  fun setBranch(branch: Branch) {
    _activeBranch.value = branch
    _currentUser.value = _currentUser.value?.copy(
      branchId = branch.id,
      branchName = branch.name
    )
  }

  fun setConnectionMode(mode: ConnectionStatus) {
    _connectionStatus.value = mode
  }

  fun setOrderFilter(status: OrderStatus?) {
    _selectedOrderFilter.value = status
  }

  fun selectOrderForDetail(order: Order) {
    _selectedOrderForDetail.value = order
  }

  fun updateOrderStatus(orderId: String, newStatus: OrderStatus) {
    _orders.value = _orders.value.map {
      if (it.id == orderId) it.copy(status = newStatus) else it
    }
    if (_selectedOrderForDetail.value?.id == orderId) {
      _selectedOrderForDetail.value = _selectedOrderForDetail.value?.copy(status = newStatus)
    }

    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_ORDER_STATUS",
      details = "Order #$orderId -> ${newStatus.name}",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  // Dining Tables Management
  fun toggleTableAvailability(tableId: String, isAvailable: Boolean) {
    _diningTables.value = _diningTables.value.map {
      if (it.id == tableId) it.copy(isAvailable = isAvailable) else it
    }
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_TABLE",
      details = "Table $tableId -> isAvailable=$isAvailable",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun saveTable(table: DiningTable) {
    val exists = _diningTables.value.any { it.id == table.id }
    if (exists) {
      _diningTables.value = _diningTables.value.map { if (it.id == table.id) table else it }
    } else {
      _diningTables.value = _diningTables.value + table
    }
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "SAVE_TABLE",
      details = "Table ${table.tableNumber} saved",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  // Reservations Management
  fun updateReservationStatus(resId: String, nextStatus: ReservationStatus) {
    _reservations.value = _reservations.value.map {
      if (it.id == resId) it.copy(status = nextStatus) else it
    }
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_RESERVATION_STATUS",
      details = "Reservation $resId -> ${nextStatus.name}",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  // Store Operations Controls
  fun toggleStoreOpen(isOpen: Boolean) {
    _storeConfig.value = _storeConfig.value.copy(isOpenForOrders = isOpen)
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_STORE_HOURS",
      details = "Store Open -> $isOpen",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun updateStoreSchedule(opening: String, closing: String, slotMins: Int) {
    _storeConfig.value = _storeConfig.value.copy(
      openingTime = opening,
      closingTime = closing,
      slotIntervalMinutes = slotMins
    )
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_STORE_HOURS",
      details = "Schedule: $opening - $closing, slots: ${slotMins}m",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun toggleAcceptingReservations(accepting: Boolean) {
    _storeConfig.value = _storeConfig.value.copy(acceptingReservations = accepting)
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_STORE_HOURS",
      details = "Global Reservations: $accepting",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun updateWeeklySchedule(schedule: List<DaySchedule>) {
    val firstOpen = schedule.firstOrNull { it.isOpen } ?: schedule.firstOrNull()
    _storeConfig.value = _storeConfig.value.copy(
      weeklySchedule = schedule,
      openingTime = firstOpen?.openTime ?: _storeConfig.value.openingTime,
      closingTime = firstOpen?.closeTime ?: _storeConfig.value.closingTime
    )
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_STORE_HOURS",
      details = "Weekly Schedule updated (7 days)",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  // Full Menu CRUD
  fun addMenuItem(item: MenuItem) {
    _menuItems.value = listOf(item) + _menuItems.value
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "CREATE_MENU_ITEM",
      details = "Item ${item.name} added",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun updateMenuItem(item: MenuItem) {
    _menuItems.value = _menuItems.value.map { if (it.id == item.id) item else it }
    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_MENU_ITEM",
      details = "Item ${item.id} updated",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun toggleMenuItemStock(itemId: String, inStock: Boolean) {
    _menuItems.value = _menuItems.value.map {
      if (it.id == itemId) it.copy(inStock = inStock) else it
    }

    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "TOGGLE_MENU_STOCK",
      details = "Item $itemId -> inStock=$inStock",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun updateMenuItemPrice(itemId: String, newPrice: Double) {
    _menuItems.value = _menuItems.value.map {
      if (it.id == itemId) it.copy(price = newPrice) else it
    }

    val outbox = OutboxItem(
      id = "act_${System.currentTimeMillis()}",
      actionType = "UPDATE_MENU_PRICE",
      details = "Item $itemId -> $$newPrice",
      timestamp = System.currentTimeMillis()
    )
    _outboxQueue.value = listOf(outbox) + _outboxQueue.value
  }

  fun setMenuCategory(category: String) {
    _selectedMenuCategory.value = category
  }

  fun setMenuSearchQuery(query: String) {
    _menuSearchQuery.value = query
  }

  fun syncOutboxNow() {
    viewModelScope.launch {
      delay(600)
      _outboxQueue.value = emptyList()
    }
  }

  fun simulateNewIncomingOrder() {
    val nextNum = (_orders.value.mapNotNull { it.orderNumber.toIntOrNull() }.maxOrNull() ?: 207) + 1
    val newOrder = Order(
      id = "ord_$nextNum",
      orderNumber = nextNum.toString(),
      branchId = _activeBranch.value.id,
      customerName = listOf("Chloe Zhang", "James Miller", "Maya Lin", "Liam Davis").random(),
      customerPhone = "+1 (555) 901-55${nextNum % 100}",
      status = OrderStatus.NEW,
      pickupCode = (1000..9999).random().toString(),
      totalAmount = 28.50,
      createdAtMillis = System.currentTimeMillis(),
      notes = "Local pickup counter request",
      items = listOf(
        OrderItem("i_sim1", "Smash Truffle Double Burger", 1, 14.00),
        OrderItem("i_sim2", "House Mango Iced Tea", 1, 4.25),
        OrderItem("i_sim3", "Parmesan Herb Crinkle Fries", 1, 6.50)
      )
    )
    _orders.value = listOf(newOrder) + _orders.value
  }

  private fun String.capitalizeWords(): String =
    split(" ").joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
}
