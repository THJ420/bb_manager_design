package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.OrderStatus
import com.example.ui.components.FilterChipData
import com.example.ui.components.HorizontalFilterChips
import com.example.ui.components.StatusBadge
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun PickupOrdersScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val orders by viewModel.orders.collectAsState()
  var selectedFilter by remember { mutableStateOf<OrderStatus?>(null) }
  var searchQuery by remember { mutableStateOf("") }

  val filterOptions = remember(orders) {
    listOf<FilterChipData<OrderStatus?>>(
      FilterChipData(null, "All Ledger", orders.size),
      FilterChipData(OrderStatus.NEW, "Pending", orders.count { it.status == OrderStatus.NEW }),
      FilterChipData(OrderStatus.PREPARING, "Preparing", orders.count { it.status == OrderStatus.PREPARING }),
      FilterChipData(OrderStatus.READY, "Ready", orders.count { it.status == OrderStatus.READY }),
      FilterChipData(OrderStatus.COMPLETED, "Completed", orders.count { it.status == OrderStatus.COMPLETED })
    )
  }

  val filteredOrders = remember(orders, selectedFilter, searchQuery) {
    orders.filter { o ->
      val matchesFilter = selectedFilter == null || o.status == selectedFilter
      val matchesSearch = searchQuery.isBlank() ||
        o.orderNumber.contains(searchQuery) ||
        o.customerName.contains(searchQuery, ignoreCase = true) ||
        o.pickupCode.contains(searchQuery)
      matchesFilter && matchesSearch
    }
  }

  Column(
    modifier = modifier
      .fillMaxSize()
      .background(CharcoalBackground)
  ) {
    // Header
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .background(CharcoalSurface)
        .padding(horizontal = 16.dp, vertical = 12.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Column {
        Text(
          text = "Pickup Orders Ledger",
          color = TextPrimary,
          fontSize = 20.sp,
          fontWeight = FontWeight.Black,
          letterSpacing = (-0.5).sp
        )
        Text(
          text = "Historical ledger & status progression audit",
          color = TextMuted,
          fontSize = 12.sp,
          fontWeight = FontWeight.SemiBold
        )
      }

      Surface(
        shape = RoundedCornerShape(12.dp),
        color = CharcoalHighlight,
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder)
      ) {
        Text(
          text = "${orders.size} Records",
          color = TextSecondary,
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold,
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        )
      }
    }

    // Search bar
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .background(CharcoalSurface)
        .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
      OutlinedTextField(
        value = searchQuery,
        onValueChange = { searchQuery = it },
        placeholder = { Text("Search by #Order, Customer, or PIN...", color = TextMuted) },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
          focusedBorderColor = AccentPrimary,
          unfocusedBorderColor = CharcoalBorder,
          focusedTextColor = TextPrimary,
          unfocusedTextColor = TextPrimary,
          focusedContainerColor = CharcoalElevated,
          unfocusedContainerColor = CharcoalElevated
        ),
        modifier = Modifier.fillMaxWidth()
      )
    }

    // Horizontal Chips
    HorizontalFilterChips(
      options = filterOptions,
      selectedId = selectedFilter,
      onSelect = { selectedFilter = it }
    )

    // Ledger List
    LazyColumn(
      modifier = Modifier.fillMaxSize(),
      contentPadding = PaddingValues(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      items(filteredOrders, key = { it.id }) { order ->
        Card(
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = CharcoalElevated),
          border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(modifier = Modifier.padding(16.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                Text(
                  text = "#${order.orderNumber}",
                  color = TextPrimary,
                  fontSize = 18.sp,
                  fontWeight = FontWeight.ExtraBold
                )
                Surface(
                  shape = RoundedCornerShape(6.dp),
                  color = CharcoalHighlight
                ) {
                  Text(
                    text = "PIN ${order.pickupCode}",
                    color = TextSecondary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                  )
                }
              }

              StatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Column {
                Text(
                  text = order.customerName,
                  color = TextPrimary,
                  fontSize = 15.sp,
                  fontWeight = FontWeight.SemiBold
                )
                Text(
                  text = order.customerPhone,
                  color = TextMuted,
                  fontSize = 12.sp
                )
              }
              Text(
                text = "$${String.format("%.2f", order.totalAmount)}",
                color = TextPrimary,
                fontSize = 17.sp,
                fontWeight = FontWeight.Black
              )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Items breakdown ledger
            Surface(
              shape = RoundedCornerShape(8.dp),
              color = CharcoalHighlight,
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                order.items.forEach { item ->
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                  ) {
                    Text(
                      text = "${item.quantity}x ${item.name}",
                      color = TextPrimary,
                      fontSize = 12.sp,
                      modifier = Modifier.weight(1f)
                    )
                    Text(
                      text = "$${String.format("%.2f", item.unitPrice * item.quantity)}",
                      color = TextSecondary,
                      fontSize = 12.sp,
                      fontWeight = FontWeight.SemiBold
                    )
                  }
                }
              }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Status progression button
            when (order.status) {
              OrderStatus.NEW -> {
                Button(
                  onClick = { viewModel.updateOrderStatus(order.id, OrderStatus.PREPARING) },
                  colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                  shape = RoundedCornerShape(8.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 46.dp)
                ) {
                  Text("START PREPARATION", fontWeight = FontWeight.Bold)
                }
              }
              OrderStatus.PREPARING -> {
                Button(
                  onClick = { viewModel.updateOrderStatus(order.id, OrderStatus.READY) },
                  colors = ButtonDefaults.buttonColors(containerColor = StatusSuccess),
                  shape = RoundedCornerShape(8.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 46.dp)
                ) {
                  Text("MARK READY FOR PICKUP", color = TextInverse, fontWeight = FontWeight.ExtraBold)
                }
              }
              OrderStatus.READY -> {
                Button(
                  onClick = { viewModel.updateOrderStatus(order.id, OrderStatus.COMPLETED) },
                  colors = ButtonDefaults.buttonColors(containerColor = AccentSlateDark),
                  shape = RoundedCornerShape(8.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 46.dp)
                ) {
                  Text("HAND OVER / COMPLETE PICKUP", color = Color.White, fontWeight = FontWeight.Bold)
                }
              }
              else -> Unit
            }
          }
        }
      }
    }
  }
}
