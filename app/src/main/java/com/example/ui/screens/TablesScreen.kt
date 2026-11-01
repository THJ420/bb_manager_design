package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.DiningTable
import com.example.ui.components.FilterChipData
import com.example.ui.components.HorizontalFilterChips
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun TablesScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val tables by viewModel.diningTables.collectAsState()
  val storeConfig by viewModel.storeConfig.collectAsState()
  var selectedZone by remember { mutableStateOf("All") }
  var showDialog by remember { mutableStateOf(false) }
  var editingTable by remember { mutableStateOf<DiningTable?>(null) }

  val zones = listOf("All", "Main Dining", "Patio", "Bar")
  val zoneChips = remember(tables) {
    zones.map { z ->
      val count = if (z == "All") tables.size else tables.count { it.zone == z }
      FilterChipData(z, z, count)
    }
  }

  val filteredTables = remember(tables, selectedZone) {
    if (selectedZone == "All") tables else tables.filter { it.zone == selectedZone }
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
          text = "Dining Tables",
          color = TextPrimary,
          fontSize = 20.sp,
          fontWeight = FontWeight.Black,
          letterSpacing = (-0.5).sp
        )
        Text(
          text = "Floor plan, seating capacity & occupancy",
          color = TextMuted,
          fontSize = 12.sp,
          fontWeight = FontWeight.SemiBold
        )
      }

      Button(
        onClick = {
          editingTable = null
          showDialog = true
        },
        colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.defaultMinSize(minHeight = 44.dp)
      ) {
        Text("+ ADD TABLE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
      }
    }

    // Prominent Global Reservation Master Switch Banner
    Card(
      shape = RoundedCornerShape(12.dp),
      colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
      border = androidx.compose.foundation.BorderStroke(
        1.dp,
        if (storeConfig.acceptingReservations) StatusSuccess.copy(alpha = 0.4f) else StatusError.copy(alpha = 0.5f)
      ),
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp, vertical = 8.dp)
        .testTag("global_reservation_switch_card")
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(if (storeConfig.acceptingReservations) StatusSuccess else StatusError)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
              text = if (storeConfig.acceptingReservations) "BOOKINGS LIVE" else "BOOKINGS SUSPENDED",
              color = if (storeConfig.acceptingReservations) StatusSuccess else StatusError,
              fontSize = 10.sp,
              fontWeight = FontWeight.Black,
              letterSpacing = 0.5.sp
            )
          }
          Spacer(modifier = Modifier.height(3.dp))
          Text(
            text = "Accept Website Table Bookings",
            color = TextPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = if (storeConfig.acceptingReservations)
              "Online guests can reserve tables via the web portal."
            else
              "Suspended: Table bookings halted across website backend.",
            color = TextMuted,
            fontSize = 11.sp,
            lineHeight = 15.sp
          )
        }

        Switch(
          checked = storeConfig.acceptingReservations,
          onCheckedChange = { viewModel.toggleAcceptingReservations(it) },
          colors = SwitchDefaults.colors(
            checkedThumbColor = StatusSuccess,
            checkedTrackColor = StatusSuccessMuted,
            uncheckedThumbColor = StatusError,
            uncheckedTrackColor = StatusErrorMuted
          ),
          modifier = Modifier.testTag("global_reservation_master_switch")
        )
      }
    }

    // Horizontal Zone Filter Chips
    HorizontalFilterChips(
      options = zoneChips,
      selectedId = selectedZone,
      onSelect = { selectedZone = it }
    )

    // Tables List
    LazyColumn(
      modifier = Modifier.fillMaxSize(),
      contentPadding = PaddingValues(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      items(filteredTables, key = { it.id }) { table ->
        Card(
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = CharcoalElevated),
          border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (table.isAvailable) CharcoalBorder else StatusWarning.copy(alpha = 0.4f)
          ),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(modifier = Modifier.padding(16.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Surface(
                shape = RoundedCornerShape(6.dp),
                color = CharcoalHighlight,
                border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder)
              ) {
                Text(
                  text = table.tableNumber,
                  color = TextPrimary,
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold,
                  fontFamily = FontFamily.Monospace,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
              }

              // Status Pill
              Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                  .clip(CircleShape)
                  .background(if (table.isAvailable) StatusSuccessMuted else StatusWarningMuted)
                  .padding(horizontal = 8.dp, vertical = 4.dp)
              ) {
                Box(
                  modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(if (table.isAvailable) StatusSuccess else StatusWarning)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (table.isAvailable) "AVAILABLE" else "OCCUPIED",
                  color = if (table.isAvailable) StatusSuccess else StatusWarning,
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
              text = table.name,
              color = TextPrimary,
              fontSize = 16.sp,
              fontWeight = FontWeight.Bold
            )
            Text(
              text = "Zone: ${table.zone} • Capacity: ${table.capacity} Guests",
              color = TextMuted,
              fontSize = 12.sp,
              modifier = Modifier.padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
            Spacer(modifier = Modifier.height(8.dp))

            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              TextButton(
                onClick = {
                  editingTable = table
                  showDialog = true
                },
                modifier = Modifier.defaultMinSize(minHeight = 44.dp)
              ) {
                Text(
                  text = "EDIT DETAILS",
                  color = AccentPrimary,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }

              Surface(
                shape = RoundedCornerShape(6.dp),
                color = CharcoalHighlight,
                border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder)
              ) {
                Text(
                  text = "ZONE: ${table.zone.uppercase()}",
                  color = TextMuted,
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold,
                  letterSpacing = 0.5.sp,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
              }
            }
          }
        }
      }
    }
  }

  // Create / Edit Table Dialog
  if (showDialog) {
    var name by remember { mutableStateOf(editingTable?.name ?: "") }
    var cap by remember { mutableStateOf(editingTable?.capacity?.toString() ?: "4") }

    AlertDialog(
      onDismissRequest = { showDialog = false },
      containerColor = CharcoalSurface,
      shape = RoundedCornerShape(16.dp),
      title = {
        Text(
          text = if (editingTable == null) "Add Dining Table" else "Edit Dining Table",
          color = TextPrimary,
          fontWeight = FontWeight.Bold,
          fontSize = 18.sp
        )
      },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
          Text(
            text = "Specify table identifier and guest seating capacity.",
            color = TextMuted,
            fontSize = 12.sp
          )

          OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Table Name (e.g., Table 4, Patio 1)") },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
              focusedBorderColor = AccentPrimary,
              unfocusedBorderColor = CharcoalBorder,
              focusedTextColor = TextPrimary,
              unfocusedTextColor = TextPrimary
            ),
            modifier = Modifier.fillMaxWidth().testTag("input_table_name")
          )

          OutlinedTextField(
            value = cap,
            onValueChange = { cap = it },
            label = { Text("Seating Capacity (e.g., 4, 6, 8)") },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
              focusedBorderColor = AccentPrimary,
              unfocusedBorderColor = CharcoalBorder,
              focusedTextColor = TextPrimary,
              unfocusedTextColor = TextPrimary
            ),
            modifier = Modifier.fillMaxWidth().testTag("input_table_capacity")
          )
        }
      },
      confirmButton = {
        Button(
          onClick = {
            if (name.isNotBlank()) {
              val table = DiningTable(
                id = editingTable?.id ?: "tbl_${System.currentTimeMillis()}",
                branchId = "branch_dt_01",
                tableNumber = editingTable?.tableNumber?.ifBlank { null } ?: name.trim(),
                name = name.trim(),
                capacity = cap.toIntOrNull() ?: 4,
                isAvailable = editingTable?.isAvailable ?: true,
                zone = editingTable?.zone ?: "Main Dining"
              )
              viewModel.saveTable(table)
              showDialog = false
            }
          },
          colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
        ) {
          Text("Save Table", fontWeight = FontWeight.Bold)
        }
      },
      dismissButton = {
        TextButton(onClick = { showDialog = false }) {
          Text("Cancel", color = TextSecondary)
        }
      }
    )
  }
}
