package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.*
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun OrdersScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val orders by viewModel.orders.collectAsState()
  val activeBranch by viewModel.activeBranch.collectAsState()
  val connectionStatus by viewModel.connectionStatus.collectAsState()
  val outboxQueue by viewModel.outboxQueue.collectAsState()
  val selectedFilter by viewModel.selectedOrderFilter.collectAsState()
  val selectedDetailOrder by viewModel.selectedOrderForDetail.collectAsState()

  val filteredOrders = remember(orders, selectedFilter) {
    if (selectedFilter == null) orders else orders.filter { it.status == selectedFilter }
  }

  val filterOptions = remember(orders) {
    listOf<FilterChipData<OrderStatus?>>(
      FilterChipData(null, "All", orders.size),
      FilterChipData(OrderStatus.NEW, "New", orders.count { it.status == OrderStatus.NEW }),
      FilterChipData(OrderStatus.PREPARING, "Preparing", orders.count { it.status == OrderStatus.PREPARING }),
      FilterChipData(OrderStatus.READY, "Ready", orders.count { it.status == OrderStatus.READY }),
      FilterChipData(OrderStatus.COMPLETED, "Completed", orders.count { it.status == OrderStatus.COMPLETED })
    )
  }

  BoxWithConstraints(
    modifier = modifier
      .fillMaxSize()
      .background(CharcoalBackground)
  ) {
    val isTabletSplit = maxWidth >= 600.dp

    Column(modifier = Modifier.fillMaxSize()) {
      // Top Header Bar
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
            text = "Orders Board",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = (-0.5).sp
          )
          Text(
            text = "${activeBranch.name} • ${activeBranch.code}",
            color = TextMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
          )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
          ConnectionBadge(
            status = connectionStatus,
            outboxCount = outboxQueue.size
          )
          Spacer(modifier = Modifier.width(8.dp))
          // Floor quick simulation button
          FilledTonalButton(
            onClick = { viewModel.simulateNewIncomingOrder() },
            modifier = Modifier
              .defaultMinSize(minHeight = 48.dp)
              .testTag("btn_sim_incoming_order"),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.filledTonalButtonColors(
              containerColor = CharcoalHighlight,
              contentColor = AccentPrimary
            )
          ) {
            Text("+ New Order", fontSize = 12.sp, fontWeight = FontWeight.Bold)
          }
        }
      }

      // Mandatory Horizontal Status Filter Chips (pinned beneath header, never vertical)
      HorizontalFilterChips(
        options = filterOptions,
        selectedId = selectedFilter,
        onSelect = { viewModel.setOrderFilter(it) }
      )

      if (isTabletSplit) {
        // Split-view layout for larger screens / Counter Tablets
        Row(modifier = Modifier.fillMaxSize()) {
          // Left column: list of orders
          LazyColumn(
            modifier = Modifier
              .weight(1.2f)
              .fillMaxHeight(),
            contentPadding = PaddingValues(bottom = 24.dp)
          ) {
            items(filteredOrders, key = { it.id }) { order ->
              OrderCard(
                order = order,
                onUpdateStatus = { id, status -> viewModel.updateOrderStatus(id, status) },
                onClick = { viewModel.selectOrderForDetail(order) }
              )
            }
          }

          VerticalDivider(color = CharcoalBorder, thickness = 1.dp)

          // Right column: Selected order details & Pickup PIN verification
          Box(
            modifier = Modifier
              .weight(0.8f)
              .fillMaxHeight()
              .background(CharcoalSurface)
              .padding(16.dp)
          ) {
            if (selectedDetailOrder != null) {
              val currentOrder = selectedDetailOrder!!
              Column {
                Text(
                  text = "Counter Hand-Off Station",
                  color = TextPrimary,
                  fontSize = 16.sp,
                  fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Verification PIN container
                Card(
                  shape = RoundedCornerShape(12.dp),
                  colors = CardDefaults.cardColors(containerColor = CharcoalElevated),
                  border = androidx.compose.foundation.BorderStroke(1.dp, AccentPrimary)
                ) {
                  Column(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                  ) {
                    Text(
                      text = "CUSTOMER PICKUP PIN",
                      color = TextMuted,
                      fontSize = 10.sp,
                      fontWeight = FontWeight.ExtraBold,
                      letterSpacing = 1.sp
                    )
                    Text(
                      text = currentOrder.pickupCode,
                      color = AccentPrimary,
                      fontSize = 36.sp,
                      fontWeight = FontWeight.Black,
                      letterSpacing = 4.sp,
                      fontFamily = FontFamily.Monospace
                    )
                  }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                  text = "Customer: ${currentOrder.customerName}",
                  color = TextPrimary,
                  fontSize = 15.sp,
                  fontWeight = FontWeight.Bold
                )
                Text(
                  text = "Phone: ${currentOrder.customerPhone}",
                  color = TextMuted,
                  fontSize = 13.sp
                )

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
                Spacer(modifier = Modifier.height(16.dp))

                Text(
                  text = "Kitchen Checklist:",
                  color = TextSecondary,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                currentOrder.items.forEach { item ->
                  Text(
                    text = "• ${item.quantity}x ${item.name} ($${String.format("%.2f", item.unitPrice * item.quantity)})",
                    color = TextPrimary,
                    fontSize = 13.sp
                  )
                }

                Spacer(modifier = Modifier.height(20.dp))

                StatusBadge(status = currentOrder.status)
              }
            } else {
              Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(text = "Select an order to inspect pickup details", color = TextMuted)
              }
            }
          }
        }
      } else {
        // Standard vertical list for handheld portrait mode
        if (filteredOrders.isEmpty()) {
          Box(
            modifier = Modifier
              .fillMaxSize()
              .padding(32.dp),
            contentAlignment = Alignment.Center
          ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
              Text(text = "📦", fontSize = 42.sp)
              Spacer(modifier = Modifier.height(12.dp))
              Text(
                text = "No orders in this stage",
                color = TextPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
              )
              Text(
                text = "New tickets for this status filter will appear automatically.",
                color = TextMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 4.dp)
              )
            }
          }
        } else {
          LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 12.dp)
          ) {
            items(filteredOrders, key = { it.id }) { order ->
              OrderCard(
                order = order,
                onUpdateStatus = { id, status -> viewModel.updateOrderStatus(id, status) },
                onClick = { viewModel.selectOrderForDetail(order) }
              )
            }
          }
        }
      }
    }
  }
}
