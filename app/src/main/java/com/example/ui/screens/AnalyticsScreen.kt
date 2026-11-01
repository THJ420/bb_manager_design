package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.OrderStatus
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun AnalyticsScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val orders by viewModel.orders.collectAsState()
  val activeBranch by viewModel.activeBranch.collectAsState()

  val totalRevenue = remember(orders) {
    orders.filter { it.status != OrderStatus.CANCELLED }.sumOf { it.totalAmount }
  }
  val completedCount = remember(orders) {
    orders.count { it.status == OrderStatus.COMPLETED }
  }
  val newCount = remember(orders) {
    orders.count { it.status == OrderStatus.NEW }
  }
  val prepCount = remember(orders) {
    orders.count { it.status == OrderStatus.PREPARING }
  }
  val readyCount = remember(orders) {
    orders.count { it.status == OrderStatus.READY }
  }
  val cancelledCount = remember(orders) {
    orders.count { it.status == OrderStatus.CANCELLED }
  }
  val activeTickets = newCount + prepCount + readyCount

  Column(
    modifier = modifier
      .fillMaxSize()
      .background(CharcoalBackground)
  ) {
    // Top Bar
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
          text = "Floor Analytics",
          color = TextPrimary,
          fontSize = 20.sp,
          fontWeight = FontWeight.Black,
          letterSpacing = (-0.5).sp
        )
        Text(
          text = "${activeBranch.name} • Shift Performance",
          color = TextMuted,
          fontSize = 12.sp,
          fontWeight = FontWeight.SemiBold
        )
      }

      Surface(
        shape = CircleShape,
        color = CharcoalHighlight,
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder)
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Box(
            modifier = Modifier
              .size(6.dp)
              .clip(CircleShape)
              .background(StatusSuccess)
          )
          Spacer(modifier = Modifier.width(6.dp))
          Text(
            text = "LIVE SHIFT",
            color = StatusSuccess,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 0.5.sp
          )
        }
      }
    }

    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      // Metric 1: Daily Revenue & ARPT
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Box(modifier = Modifier.weight(1f)) {
          AnalyticsMetricCard(
            title = "DAILY REVENUE",
            value = "$${String.format("%.2f", totalRevenue)}",
            subtitle = "+18.4% vs yesterday",
            accentColor = StatusSuccess,
            badge = "GROSS",
            icon = "💵"
          )
        }
        Box(modifier = Modifier.weight(1f)) {
          val arpt = if (completedCount + newCount + prepCount + readyCount > 0) totalRevenue / (completedCount + newCount + prepCount + readyCount) else 26.15
          AnalyticsMetricCard(
            title = "AVG / TICKET",
            value = "$${String.format("%.2f", arpt)}",
            subtitle = "Target: $24.00+",
            accentColor = AccentPrimary,
            badge = "ARPT",
            icon = "🧾"
          )
        }
      }

      // Metric 2: Completed Orders & Cancellation Rate
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Box(modifier = Modifier.weight(1f)) {
          AnalyticsMetricCard(
            title = "COMPLETED",
            value = completedCount.toString(),
            subtitle = "$activeTickets tickets live",
            accentColor = AccentPrimary,
            badge = "HANDED OFF",
            icon = "📦"
          )
        }
        Box(modifier = Modifier.weight(1f)) {
          val cancelRate = if (orders.isNotEmpty()) (cancelledCount.toDouble() / orders.size.toDouble()) * 100.0 else 3.8
          AnalyticsMetricCard(
            title = "VOID / CANCEL",
            value = "${String.format("%.1f", cancelRate)}%",
            subtitle = "Threshold: < 5.0%",
            accentColor = if (cancelRate > 5.0) StatusError else StatusSuccess,
            badge = "HEALTH",
            icon = "⚠️"
          )
        }
      }

      // Metric 3: Prep Time & Table Turnover
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Box(modifier = Modifier.weight(1f)) {
          AnalyticsMetricCard(
            title = "AVG PREP TIME",
            value = "11.4m",
            subtitle = "Target: 12.0m",
            accentColor = StatusWarning,
            badge = "SLA",
            icon = "⏱️"
          )
        }
        Box(modifier = Modifier.weight(1f)) {
          AnalyticsMetricCard(
            title = "TABLE TURNOVER",
            value = "1.8x",
            subtitle = "Per table / hr",
            accentColor = StatusInfo,
            badge = "FLOOR",
            icon = "🪑"
          )
        }
      }

      // Metric 4: Staff Efficiency Score Card
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        modifier = Modifier.fillMaxWidth()
      ) {
        Row(
          modifier = Modifier.padding(16.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Column {
            Text(
              text = "STAFF SHIFT EFFICIENCY SCORE",
              color = TextMuted,
              fontSize = 10.sp,
              fontWeight = FontWeight.ExtraBold,
              letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
              Text(
                text = "94.2%",
                color = StatusSuccess,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black
              )
              Spacer(modifier = Modifier.width(8.dp))
              Text(
                text = "EXCELLENT PERFORMANCE",
                color = StatusSuccess,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 3.dp)
              )
            }
          }

          Surface(
            shape = CircleShape,
            color = StatusSuccessMuted,
            border = androidx.compose.foundation.BorderStroke(1.dp, StatusSuccess.copy(alpha = 0.4f))
          ) {
            Text(
              text = "GRADE A+",
              color = StatusSuccess,
              fontSize = 11.sp,
              fontWeight = FontWeight.ExtraBold,
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
            )
          }
        }
      }

      // Peak Order Hours Breakdown
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text(
            text = "PEAK ORDER HOURS BREAKDOWN",
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 1.sp
          )
          Spacer(modifier = Modifier.height(14.dp))

          val peakData = listOf(
            Triple("11 AM - 1 PM", 85, 1.0f),
            Triple("1 PM - 5 PM", 42, 0.49f),
            Triple("5 PM - 8 PM", 110, 1.0f),
            Triple("8 PM - 11 PM", 35, 0.41f)
          )

          peakData.forEach { (timeSlot, count, fraction) ->
            Column(modifier = Modifier.padding(vertical = 4.dp)) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
              ) {
                Text(text = timeSlot, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Text(text = "$count orders", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
              }
              Spacer(modifier = Modifier.height(4.dp))
              Box(
                modifier = Modifier
                  .fillMaxWidth()
                  .height(8.dp)
                  .clip(RoundedCornerShape(4.dp))
                  .background(CharcoalHighlight)
              ) {
                Box(
                  modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(fraction)
                    .clip(RoundedCornerShape(4.dp))
                    .background(if (count > 80) AccentPrimary else StatusInfo)
                )
              }
            }
          }
        }
      }

      // Kitchen Ticket Distribution
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Text(
              text = "KITCHEN TICKET DISTRIBUTION",
              color = TextMuted,
              fontSize = 10.sp,
              fontWeight = FontWeight.ExtraBold,
              letterSpacing = 1.sp
            )
            Text(
              text = "${orders.size} TOTAL TICKETS",
              color = TextSecondary,
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold
            )
          }

          Spacer(modifier = Modifier.height(14.dp))

          // Multi-color progress bar
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .height(8.dp)
              .clip(RoundedCornerShape(4.dp))
              .background(CharcoalHighlight)
          ) {
            if (orders.isNotEmpty()) {
              if (newCount > 0) {
                Box(
                  modifier = Modifier
                    .weight(newCount.toFloat())
                    .fillMaxHeight()
                    .background(StatusInfo)
                )
              }
              if (prepCount > 0) {
                Box(
                  modifier = Modifier
                    .weight(prepCount.toFloat())
                    .fillMaxHeight()
                    .background(StatusWarning)
                )
              }
              if (readyCount > 0) {
                Box(
                  modifier = Modifier
                    .weight(readyCount.toFloat())
                    .fillMaxHeight()
                    .background(StatusSuccess)
                )
              }
              if (completedCount > 0) {
                Box(
                  modifier = Modifier
                    .weight(completedCount.toFloat())
                    .fillMaxHeight()
                    .background(AccentSlate)
                )
              }
            }
          }

          Spacer(modifier = Modifier.height(16.dp))

          StatusBreakdownRow(label = "New Unacknowledged", count = newCount, color = StatusInfo)
          StatusBreakdownRow(label = "In Kitchen Preparation", count = prepCount, color = StatusWarning)
          StatusBreakdownRow(label = "Ready on Counter Shelf", count = readyCount, color = StatusSuccess)
          StatusBreakdownRow(label = "Completed & Picked Up", count = completedCount, color = AccentSlate)
          StatusBreakdownRow(label = "Voided / Cancelled", count = cancelledCount, color = StatusError, isLast = true)
        }
      }

      // Speed of service advisory
      Surface(
        shape = RoundedCornerShape(12.dp),
        color = CharcoalElevated,
        border = androidx.compose.foundation.BorderStroke(1.dp, AccentPrimary.copy(alpha = 0.3f)),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(14.dp)) {
          Text(
            text = "SPEED OF SERVICE ADVISORY",
            color = AccentPrimary,
            fontSize = 11.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 0.8.sp
          )
          Spacer(modifier = Modifier.height(4.dp))
          Text(
            text = "Current kitchen throughput is operating at 94% efficiency. Counter shelf turnaround time is under 3 minutes per ready pickup ticket.",
            color = TextSecondary,
            fontSize = 12.sp,
            lineHeight = 17.sp
          )
        }
      }
    }
  }
}

@Composable
fun AnalyticsMetricCard(
  title: String,
  value: String,
  subtitle: String,
  accentColor: Color,
  badge: String,
  icon: String
) {
  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = CharcoalElevated),
    border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
    modifier = Modifier.fillMaxWidth()
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .height(IntrinsicSize.Min)
    ) {
      // Left vertical accent stripe
      Box(
        modifier = Modifier
          .width(4.dp)
          .fillMaxHeight()
          .background(accentColor)
      )

      Column(modifier = Modifier.padding(16.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = title,
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 0.8.sp
          )
          Surface(
            shape = RoundedCornerShape(4.dp),
            color = accentColor.copy(alpha = 0.15f)
          ) {
            Text(
              text = badge,
              color = accentColor,
              fontSize = 9.sp,
              fontWeight = FontWeight.ExtraBold,
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
          }
        }

        Spacer(modifier = Modifier.height(6.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = value,
            color = TextPrimary,
            fontSize = 26.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = (-0.5).sp
          )
          Text(text = icon, fontSize = 20.sp)
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
          text = subtitle,
          color = TextSecondary,
          fontSize = 12.sp,
          fontWeight = FontWeight.Medium
        )
      }
    }
  }
}

@Composable
fun StatusBreakdownRow(
  label: String,
  count: Int,
  color: Color,
  isLast: Boolean = false
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .padding(vertical = 6.dp),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
  ) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      Box(
        modifier = Modifier
          .size(8.dp)
          .clip(CircleShape)
          .background(color)
      )
      Spacer(modifier = Modifier.width(8.dp))
      Text(text = label, color = TextPrimary, fontSize = 13.sp)
    }

    Text(
      text = "$count tickets",
      color = TextSecondary,
      fontSize = 13.sp,
      fontWeight = FontWeight.Bold
    )
  }

  if (!isLast) {
    HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
  }
}
