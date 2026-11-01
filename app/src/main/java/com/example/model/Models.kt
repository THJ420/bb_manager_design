package com.example.model

enum class OrderStatus(val displayName: String) {
  NEW("NEW"),
  PREPARING("PREPARING"),
  READY("READY"),
  COMPLETED("COMPLETED"),
  CANCELLED("CANCELLED")
}

data class OrderItem(
  val id: String,
  val name: String,
  val quantity: Int,
  val unitPrice: Double,
  val specialInstructions: String? = null
)

data class Order(
  val id: String,
  val orderNumber: String,
  val branchId: String,
  val customerName: String,
  val customerPhone: String,
  val status: OrderStatus,
  val items: List<OrderItem>,
  val totalAmount: Double,
  val createdAtMillis: Long,
  val pickupCode: String,
  val notes: String? = null
)

data class MenuItem(
  val id: String,
  val branchId: String,
  val name: String,
  val category: String,
  val description: String,
  val price: Double,
  val currency: String = "USD",
  val inStock: Boolean,
  val preparationMinutes: Int = 12,
  val modifiers: List<String> = emptyList(),
  val isVisible: Boolean = true,
  val imageUrl: String? = null
)

data class DiningTable(
  val id: String,
  val branchId: String,
  val tableNumber: String = "",
  val name: String,
  val capacity: Int,
  val isAvailable: Boolean = true,
  val zone: String = "Main Dining"
)

enum class ReservationStatus(val label: String) {
  UPCOMING("UPCOMING"),
  ARRIVED("ARRIVED IN LOBBY"),
  SEATED("SEATED"),
  COMPLETED("COMPLETED"),
  CANCELLED("CANCELLED")
}

data class Reservation(
  val id: String,
  val branchId: String,
  val customerName: String,
  val customerPhone: String,
  val guestCount: Int,
  val reservationTime: String,
  val tableNumber: String? = null,
  val status: ReservationStatus,
  val specialRequests: String? = null
)

data class DaySchedule(
  val day: String,
  val isOpen: Boolean = true,
  val openTime: String = "10:00 AM",
  val closeTime: String = "10:30 PM"
)

data class StoreOperationsConfig(
  val isOpenForOrders: Boolean = true,
  val openingTime: String = "10:00 AM",
  val closingTime: String = "10:30 PM",
  val slotIntervalMinutes: Int = 30,
  val acceptingPickups: Boolean = true,
  val acceptingReservations: Boolean = true,
  val weeklySchedule: List<DaySchedule> = listOf(
    DaySchedule("Monday", true, "10:00 AM", "10:30 PM"),
    DaySchedule("Tuesday", true, "10:00 AM", "10:30 PM"),
    DaySchedule("Wednesday", true, "10:00 AM", "10:30 PM"),
    DaySchedule("Thursday", true, "10:00 AM", "10:30 PM"),
    DaySchedule("Friday", true, "10:00 AM", "11:00 PM"),
    DaySchedule("Saturday", true, "10:00 AM", "11:00 PM"),
    DaySchedule("Sunday", true, "11:00 AM", "09:30 PM")
  )
)

data class Branch(
  val id: String,
  val name: String,
  val code: String,
  val address: String,
  val phone: String,
  val isActive: Boolean
)

data class StaffUser(
  val id: String,
  val email: String,
  val name: String,
  val role: String,
  val branchId: String,
  val branchName: String
)

enum class ConnectionStatus(val label: String) {
  LIVE("SSE LIVE"),
  POLLING("POLLING"),
  OFFLINE("OFFLINE QUEUED")
}

data class OutboxItem(
  val id: String,
  val actionType: String,
  val details: String,
  val timestamp: Long
)
