package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import com.example.ui.theme.*

@Composable
fun StatusBadge(status: OrderStatus, modifier: Modifier = Modifier) {
  val (bgColor, textColor) = when (status) {
    OrderStatus.NEW -> StatusInfoMuted to StatusInfo
    OrderStatus.PREPARING -> StatusWarningMuted to StatusWarning
    OrderStatus.READY -> StatusSuccessMuted to StatusSuccess
    OrderStatus.COMPLETED -> Color(0x1FFFFFFF) to TextSecondary
    OrderStatus.CANCELLED -> StatusErrorMuted to StatusError
  }

  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = modifier
      .clip(CircleShape)
      .background(bgColor)
      .padding(horizontal = 10.dp, vertical = 4.dp)
  ) {
    Box(
      modifier = Modifier
        .size(6.dp)
        .clip(CircleShape)
        .background(textColor)
    )
    Spacer(modifier = Modifier.width(6.dp))
    Text(
      text = status.displayName,
      color = textColor,
      fontSize = 11.sp,
      fontWeight = FontWeight.Bold,
      letterSpacing = 0.5.sp
    )
  }
}

@Composable
fun ConnectionBadge(
  status: ConnectionStatus,
  outboxCount: Int,
  modifier: Modifier = Modifier
) {
  val (color, bg) = when (status) {
    ConnectionStatus.LIVE -> StatusSuccess to StatusSuccessMuted
    ConnectionStatus.POLLING -> StatusWarning to StatusWarningMuted
    ConnectionStatus.OFFLINE -> StatusError to StatusErrorMuted
  }

  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = modifier
  ) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      modifier = Modifier
        .clip(CircleShape)
        .background(bg)
        .border(1.dp, color, CircleShape)
        .padding(horizontal = 10.dp, vertical = 5.dp)
        .testTag("connection_badge")
    ) {
      Box(
        modifier = Modifier
          .size(7.dp)
          .clip(CircleShape)
          .background(color)
      )
      Spacer(modifier = Modifier.width(6.dp))
      Text(
        text = status.label,
        color = color,
        fontSize = 10.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = 0.6.sp
      )
    }

    if (outboxCount > 0) {
      Spacer(modifier = Modifier.width(6.dp))
      Box(
        modifier = Modifier
          .clip(CircleShape)
          .background(CharcoalHighlight)
          .border(1.dp, CharcoalBorder, CircleShape)
          .padding(horizontal = 8.dp, vertical = 4.dp)
      ) {
        Text(
          text = "$outboxCount queued",
          color = StatusWarning,
          fontSize = 10.sp,
          fontWeight = FontWeight.Bold
        )
      }
    }
  }
}

data class FilterChipData<T>(
  val id: T,
  val label: String,
  val count: Int? = null
)

@Composable
fun <T> HorizontalFilterChips(
  options: List<FilterChipData<T>>,
  selectedId: T,
  onSelect: (T) -> Unit,
  modifier: Modifier = Modifier
) {
  Row(
    modifier = modifier
      .fillMaxWidth()
      .background(CharcoalBackground)
      .padding(vertical = 8.dp)
      .horizontalScroll(rememberScrollState())
      .padding(horizontal = 16.dp),
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    options.forEach { opt ->
      val isSelected = opt.id == selectedId
      Surface(
        modifier = Modifier
          .defaultMinSize(minHeight = 48.dp)
          .testTag("filter_chip_${opt.label.lowercase()}"),
        shape = CircleShape,
        color = if (isSelected) AccentPrimary else CharcoalSurface,
        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        onClick = { onSelect(opt.id) }
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = opt.label,
            color = if (isSelected) Color.White else TextSecondary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold
          )
          if (opt.count != null) {
            Spacer(modifier = Modifier.width(6.dp))
            Box(
              modifier = Modifier
                .clip(CircleShape)
                .background(if (isSelected) Color.White.copy(alpha = 0.25f) else CharcoalHighlight)
                .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
              Text(
                text = opt.count.toString(),
                color = if (isSelected) Color.White else TextMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        }
      }
    }
  }
}

@Composable
fun OrderCard(
  order: Order,
  onUpdateStatus: (orderId: String, nextStatus: OrderStatus) -> Unit,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val elapsedMinutes = remember(order.createdAtMillis) {
    val diff = System.currentTimeMillis() - order.createdAtMillis
    maxOf(1, (diff / (60 * 1000)).toInt())
  }

  Card(
    modifier = modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 6.dp)
      .clickable { onClick() }
      .testTag("order_card_${order.orderNumber}"),
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = CharcoalElevated),
    border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
  ) {
    Column(modifier = Modifier.padding(16.dp)) {
      // Header: Order number, PIN and status badge
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
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = (-0.5).sp
          )
          Surface(
            shape = RoundedCornerShape(6.dp),
            color = CharcoalHighlight,
            border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder)
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

      // Customer and Timing
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Column {
          Text(
            text = order.customerName,
            color = TextPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold
          )
          Text(
            text = order.customerPhone,
            color = TextMuted,
            fontSize = 12.sp
          )
        }
        Column(horizontalAlignment = Alignment.End) {
          Text(
            text = "RECEIVED",
            color = TextMuted,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = "${elapsedMinutes}m ago",
            color = StatusWarning,
            fontSize = 12.sp,
            fontWeight = FontWeight.ExtraBold
          )
        }
      }

      Spacer(modifier = Modifier.height(10.dp))
      HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
      Spacer(modifier = Modifier.height(10.dp))

      // Items list
      Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        order.items.forEach { item ->
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
          ) {
            Box(
              modifier = Modifier
                .size(24.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(CharcoalHighlight)
                .border(1.dp, CharcoalBorder, RoundedCornerShape(4.dp)),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = "${item.quantity}x",
                color = AccentPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
              )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = item.name,
              color = TextPrimary,
              fontSize = 13.sp,
              fontWeight = FontWeight.Normal,
              modifier = Modifier.weight(1f)
            )
            Text(
              text = "$${String.format("%.2f", item.unitPrice * item.quantity)}",
              color = TextSecondary,
              fontSize = 13.sp,
              fontWeight = FontWeight.SemiBold
            )
          }
        }
      }

      if (order.notes != null) {
        Spacer(modifier = Modifier.height(6.dp))
        Text(
          text = "Note: ${order.notes}",
          color = StatusWarning,
          fontSize = 11.sp,
          fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
        )
      }

      Spacer(modifier = Modifier.height(12.dp))

      // Footer: Total & Actions (Touch target >= 48dp)
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text(
          text = "Total: $${String.format("%.2f", order.totalAmount)}",
          color = TextPrimary,
          fontSize = 15.sp,
          fontWeight = FontWeight.ExtraBold
        )
      }

      Spacer(modifier = Modifier.height(8.dp))

      when (order.status) {
        OrderStatus.NEW -> {
          Button(
            onClick = { onUpdateStatus(order.id, OrderStatus.PREPARING) },
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(min = 48.dp)
              .testTag("btn_accept_${order.orderNumber}"),
            colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
            shape = RoundedCornerShape(10.dp)
          ) {
            Text("ACCEPT & START PREP", fontWeight = FontWeight.Bold, fontSize = 13.sp)
          }
        }
        OrderStatus.PREPARING -> {
          Button(
            onClick = { onUpdateStatus(order.id, OrderStatus.READY) },
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(min = 48.dp)
              .testTag("btn_ready_${order.orderNumber}"),
            colors = ButtonDefaults.buttonColors(containerColor = StatusSuccess),
            shape = RoundedCornerShape(10.dp)
          ) {
            Text("MARK READY FOR PICKUP", color = TextInverse, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
          }
        }
        OrderStatus.READY -> {
          Button(
            onClick = { onUpdateStatus(order.id, OrderStatus.COMPLETED) },
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(min = 48.dp)
              .testTag("btn_complete_${order.orderNumber}"),
            colors = ButtonDefaults.buttonColors(containerColor = AccentSlateDark),
            border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
            shape = RoundedCornerShape(10.dp)
          ) {
            Text("COMPLETE PICKUP HANDOFF", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
          }
        }
        else -> Unit
      }
    }
  }
}

@Composable
fun MenuItemCard(
  item: MenuItem,
  onToggleStock: (Boolean) -> Unit,
  onEditPrice: () -> Unit,
  modifier: Modifier = Modifier
) {
  Card(
    modifier = modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 6.dp)
      .testTag("menu_item_${item.id}"),
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = CharcoalElevated),
    border = androidx.compose.foundation.BorderStroke(
      1.dp,
      if (item.inStock) CharcoalBorder else StatusError.copy(alpha = 0.35f)
    )
  ) {
    Column(modifier = Modifier.padding(16.dp)) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Surface(
            shape = RoundedCornerShape(6.dp),
            color = CharcoalHighlight,
            border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder)
          ) {
            Text(
              text = item.category.uppercase(),
              color = TextSecondary,
              fontSize = 10.sp,
              fontWeight = FontWeight.Bold,
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
            )
          }

          if (!item.isVisible) {
            Surface(
              shape = RoundedCornerShape(6.dp),
              color = StatusErrorMuted,
              border = androidx.compose.foundation.BorderStroke(1.dp, StatusError.copy(alpha = 0.5f))
            ) {
              Text(
                text = "HIDDEN ON WEB",
                color = StatusError,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
              )
            }
          }
        }

        // In Stock / Out of Stock Pill
        Row(
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier
            .clip(CircleShape)
            .background(if (item.inStock) StatusSuccessMuted else StatusErrorMuted)
            .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
          Box(
            modifier = Modifier
              .size(6.dp)
              .clip(CircleShape)
              .background(if (item.inStock) StatusSuccess else StatusError)
          )
          Spacer(modifier = Modifier.width(6.dp))
          Text(
            text = if (item.inStock) "IN STOCK" else "OUT OF STOCK",
            color = if (item.inStock) StatusSuccess else StatusError,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
          )
        }
      }

      Spacer(modifier = Modifier.height(10.dp))

      Text(
        text = item.name,
        color = TextPrimary,
        fontSize = 16.sp,
        fontWeight = FontWeight.Bold
      )
      Spacer(modifier = Modifier.height(4.dp))
      Text(
        text = item.description,
        color = TextMuted,
        fontSize = 12.sp,
        lineHeight = 16.sp
      )

      Spacer(modifier = Modifier.height(12.dp))
      HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
      Spacer(modifier = Modifier.height(10.dp))

      // Tappable Price (48dp touch target) & Accessible Stock Toggle (48dp touch target)
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Column(
          modifier = Modifier
            .clickable { onEditPrice() }
            .defaultMinSize(minHeight = 48.dp, minWidth = 80.dp)
            .padding(vertical = 4.dp)
            .testTag("price_edit_btn_${item.id}"),
          verticalArrangement = Arrangement.Center
        ) {
          Text(
            text = "$${String.format("%.2f", item.price)}",
            color = TextPrimary,
            fontSize = 18.sp,
            fontWeight = FontWeight.ExtraBold
          )
          Text(
            text = "TAP TO EDIT PRICE",
            color = AccentPrimary,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
          )
        }

        Row(
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier.defaultMinSize(minHeight = 48.dp)
        ) {
          Switch(
            checked = item.inStock,
            onCheckedChange = { onToggleStock(it) },
            colors = SwitchDefaults.colors(
              checkedThumbColor = StatusSuccess,
              checkedTrackColor = StatusSuccessMuted,
              uncheckedThumbColor = Color(0xFFA1A1AA),
              uncheckedTrackColor = Color(0xFF3F3F46)
            ),
            modifier = Modifier.testTag("switch_stock_${item.id}")
          )
        }
      }
    }
  }
}

@Composable
fun PriceEditDialog(
  item: MenuItem?,
  onDismiss: () -> Unit,
  onSavePrice: (Double) -> Unit
) {
  if (item == null) return

  var priceText by remember(item.id) { mutableStateOf(String.format("%.2f", item.price)) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  AlertDialog(
    onDismissRequest = onDismiss,
    containerColor = CharcoalSurface,
    titleContentColor = TextPrimary,
    textContentColor = TextSecondary,
    shape = RoundedCornerShape(20.dp),
    title = {
      Text(text = "Update Item Price", fontWeight = FontWeight.Bold, fontSize = 18.sp)
    },
    text = {
      Column {
        Text(text = item.name, color = TextSecondary, fontSize = 13.sp)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
          value = priceText,
          onValueChange = {
            priceText = it
            errorMessage = null
          },
          prefix = { Text("$", color = TextMuted, fontWeight = FontWeight.Bold) },
          label = { Text("Price (${item.currency})") },
          singleLine = true,
          isError = errorMessage != null,
          colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = AccentPrimary,
            unfocusedBorderColor = CharcoalBorder,
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary
          ),
          modifier = Modifier
            .fillMaxWidth()
            .testTag("price_input_dialog")
        )

        if (errorMessage != null) {
          Spacer(modifier = Modifier.height(4.dp))
          Text(text = errorMessage!!, color = StatusError, fontSize = 11.sp)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Quick adjustment chips
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          listOf(+0.50, +1.00, +2.00, -0.50).forEach { delta ->
            Surface(
              shape = RoundedCornerShape(6.dp),
              color = CharcoalHighlight,
              border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
              modifier = Modifier
                .weight(1f)
                .clickable {
                  val current = priceText.toDoubleOrNull() ?: item.price
                  val next = maxOf(0.0, current + delta)
                  priceText = String.format("%.2f", next)
                }
            ) {
              Box(
                modifier = Modifier.padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = if (delta > 0) "+$${String.format("%.2f", delta)}" else "-$${String.format("%.2f", -delta)}",
                  color = TextSecondary,
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }
        }
      }
    },
    confirmButton = {
      Button(
        onClick = {
          val parsed = priceText.toDoubleOrNull()
          if (parsed == null || parsed < 0) {
            errorMessage = "Please enter a valid price."
          } else {
            onSavePrice(parsed)
            onDismiss()
          }
        },
        colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.testTag("price_save_confirm")
      ) {
        Text("Save & Sync", fontWeight = FontWeight.Bold)
      }
    },
    dismissButton = {
      TextButton(onClick = onDismiss) {
        Text("Cancel", color = TextSecondary)
      }
    }
  )
}
