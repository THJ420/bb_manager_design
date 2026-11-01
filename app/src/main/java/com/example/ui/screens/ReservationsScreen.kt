package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Reservation
import com.example.model.ReservationStatus
import com.example.ui.components.FilterChipData
import com.example.ui.components.HorizontalFilterChips
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun ReservationsScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val reservations by viewModel.reservations.collectAsState()
  var selectedFilter by remember { mutableStateOf<ReservationStatus?>(null) }

  val filterOptions = remember(reservations) {
    listOf<FilterChipData<ReservationStatus?>>(
      FilterChipData(null, "All", reservations.size),
      FilterChipData(ReservationStatus.UPCOMING, "Upcoming", reservations.count { it.status == ReservationStatus.UPCOMING }),
      FilterChipData(ReservationStatus.ARRIVED, "Arrived", reservations.count { it.status == ReservationStatus.ARRIVED }),
      FilterChipData(ReservationStatus.SEATED, "Seated", reservations.count { it.status == ReservationStatus.SEATED })
    )
  }

  val filteredReservations = remember(reservations, selectedFilter) {
    if (selectedFilter == null) reservations else reservations.filter { it.status == selectedFilter }
  }

  Column(
    modifier = modifier
      .fillMaxSize()
      .background(CharcoalBackground)
  ) {
    // Header Bar
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
          text = "Guest Reservations",
          color = TextPrimary,
          fontSize = 20.sp,
          fontWeight = FontWeight.Black,
          letterSpacing = (-0.5).sp
        )
        Text(
          text = "Table bookings & arrival dispatch",
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
          text = "${reservations.count { it.status == ReservationStatus.ARRIVED }} In Lobby",
          color = StatusWarning,
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold,
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        )
      }
    }

    // Horizontal Filter Chips
    HorizontalFilterChips(
      options = filterOptions,
      selectedId = selectedFilter,
      onSelect = { selectedFilter = it }
    )

    // Reservations List
    LazyColumn(
      modifier = Modifier.fillMaxSize(),
      contentPadding = PaddingValues(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      items(filteredReservations, key = { it.id }) { res ->
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
              Text(
                text = "⏰ ${res.reservationTime}",
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.ExtraBold
              )

              val (bg, textColor) = when (res.status) {
                ReservationStatus.UPCOMING -> StatusInfoMuted to StatusInfo
                ReservationStatus.ARRIVED -> StatusWarningMuted to StatusWarning
                ReservationStatus.SEATED -> StatusSuccessMuted to StatusSuccess
                ReservationStatus.COMPLETED -> Color(0x1FFFFFFF) to TextSecondary
                ReservationStatus.CANCELLED -> StatusErrorMuted to StatusError
              }

              Surface(
                shape = CircleShape,
                color = bg
              ) {
                Text(
                  text = res.status.label,
                  color = textColor,
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
              }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
              text = res.customerName,
              color = TextPrimary,
              fontSize = 16.sp,
              fontWeight = FontWeight.Bold
            )
            Text(
              text = res.customerPhone,
              color = TextMuted,
              fontSize = 12.sp,
              modifier = Modifier.padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Surface(
                shape = RoundedCornerShape(6.dp),
                color = CharcoalHighlight
              ) {
                Text(
                  text = "👥 ${res.guestCount} Guests",
                  color = TextSecondary,
                  fontSize = 11.sp,
                  fontWeight = FontWeight.SemiBold,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
              }

              Surface(
                shape = RoundedCornerShape(6.dp),
                color = CharcoalHighlight
              ) {
                Text(
                  text = "🪑 Table ${res.tableNumber ?: "Unassigned"}",
                  color = TextSecondary,
                  fontSize = 11.sp,
                  fontWeight = FontWeight.SemiBold,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
              }
            }

            if (res.specialRequests != null) {
              Spacer(modifier = Modifier.height(8.dp))
              Surface(
                shape = RoundedCornerShape(6.dp),
                color = StatusWarningMuted,
                border = androidx.compose.foundation.BorderStroke(1.dp, StatusWarning.copy(alpha = 0.3f)),
                modifier = Modifier.fillMaxWidth()
              ) {
                Text(
                  text = "Note: ${res.specialRequests}",
                  color = StatusWarning,
                  fontSize = 11.sp,
                  fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                  modifier = Modifier.padding(8.dp)
                )
              }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Buttons
            when (res.status) {
              ReservationStatus.UPCOMING -> {
                Button(
                  onClick = { viewModel.updateReservationStatus(res.id, ReservationStatus.ARRIVED) },
                  colors = ButtonDefaults.buttonColors(containerColor = StatusWarning),
                  shape = RoundedCornerShape(8.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                ) {
                  Text("MARK AS ARRIVED IN LOBBY", color = TextInverse, fontWeight = FontWeight.Bold)
                }
              }
              ReservationStatus.ARRIVED -> {
                Button(
                  onClick = { viewModel.updateReservationStatus(res.id, ReservationStatus.SEATED) },
                  colors = ButtonDefaults.buttonColors(containerColor = StatusSuccess),
                  shape = RoundedCornerShape(8.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                ) {
                  Text("CONFIRM SEATED AT ${res.tableNumber ?: "TABLE"}", color = TextInverse, fontWeight = FontWeight.ExtraBold)
                }
              }
              ReservationStatus.SEATED -> {
                OutlinedButton(
                  onClick = { viewModel.updateReservationStatus(res.id, ReservationStatus.COMPLETED) },
                  shape = RoundedCornerShape(8.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                ) {
                  Text("COMPLETE DINING SESSION", color = TextSecondary, fontWeight = FontWeight.Bold)
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
