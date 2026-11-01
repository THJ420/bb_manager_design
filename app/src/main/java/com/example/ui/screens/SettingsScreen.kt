package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Branch
import com.example.model.ConnectionStatus
import com.example.ui.components.ConnectionBadge
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun SettingsScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val currentUser by viewModel.currentUser.collectAsState()
  val activeBranch by viewModel.activeBranch.collectAsState()
  val availableBranches by viewModel.availableBranches.collectAsState()
  val connectionStatus by viewModel.connectionStatus.collectAsState()
  val outboxQueue by viewModel.outboxQueue.collectAsState()
  val storeConfig by viewModel.storeConfig.collectAsState()

  var soundAlertsEnabled by remember { mutableStateOf(true) }
  var showLogoutConfirm by remember { mutableStateOf(false) }
  var showScheduleModal by remember { mutableStateOf(false) }

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
      Text(
        text = "Terminal Settings",
        color = TextPrimary,
        fontSize = 20.sp,
        fontWeight = FontWeight.Black,
        letterSpacing = (-0.5).sp
      )

      ConnectionBadge(status = connectionStatus, outboxCount = outboxQueue.size)
    }

    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      // 1. Staff Session Card
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text(
            text = "STAFF SESSION",
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 1.sp
          )
          Spacer(modifier = Modifier.height(12.dp))

          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(46.dp)
                .clip(CircleShape)
                .background(AccentPrimary),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = currentUser?.name?.take(2)?.uppercase() ?: "BB",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
              )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
              Text(
                text = currentUser?.name ?: "Alex Vance",
                color = TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
              )
              Text(
                text = currentUser?.role ?: "Store Operations Lead",
                color = AccentPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
              )
              Text(
                text = currentUser?.email ?: "manager@bbmanager.internal",
                color = TextMuted,
                fontSize = 11.sp
              )
            }
          }
        }
      }

      // 2. Master Store Operations & Operating Hours Panel
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(
          1.dp,
          if (storeConfig.isOpenForOrders) CharcoalBorder else StatusError.copy(alpha = 0.5f)
        ),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Text(
              text = "STORE OPERATIONS & WORKING HOURS",
              color = TextMuted,
              fontSize = 10.sp,
              fontWeight = FontWeight.ExtraBold,
              letterSpacing = 1.sp
            )

            Surface(
              shape = CircleShape,
              color = if (storeConfig.isOpenForOrders) StatusSuccessMuted else StatusErrorMuted
            ) {
              Text(
                text = if (storeConfig.isOpenForOrders) "OPEN FOR ORDERS" else "SHOP CLOSED",
                color = if (storeConfig.isOpenForOrders) StatusSuccess else StatusError,
                fontSize = 10.sp,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
              )
            }
          }

          Text(
            text = "Control real-time availability across Laravel & web checkout portals. Turning store operations OFF immediately suspends incoming online pickups and table bookings.",
            color = TextSecondary,
            fontSize = 12.sp,
            lineHeight = 16.sp,
            modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
          )

          // Master Switch
          Surface(
            shape = RoundedCornerShape(12.dp),
            color = CharcoalElevated,
            border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
            modifier = Modifier.fillMaxWidth()
          ) {
            Row(
              modifier = Modifier.padding(12.dp),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Column(modifier = Modifier.weight(1f)) {
                Text(
                  text = "Master Order Reception Switch",
                  color = TextPrimary,
                  fontWeight = FontWeight.Bold,
                  fontSize = 13.sp
                )
                Text(
                  text = if (storeConfig.isOpenForOrders) "Accepting digital pickups and bookings" else "Emergency pause: web orders disabled",
                  color = TextMuted,
                  fontSize = 11.sp
                )
              }
              Switch(
                checked = storeConfig.isOpenForOrders,
                onCheckedChange = { viewModel.toggleStoreOpen(it) },
                colors = SwitchDefaults.colors(
                  checkedThumbColor = StatusSuccess,
                  checkedTrackColor = StatusSuccessMuted,
                  uncheckedThumbColor = StatusError,
                  uncheckedTrackColor = StatusErrorMuted
                )
              )
            }
          }

          Spacer(modifier = Modifier.height(14.dp))
          HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
          Spacer(modifier = Modifier.height(12.dp))

          Text(
            text = "DAILY OPERATING SCHEDULE",
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.8.sp
          )
          Spacer(modifier = Modifier.height(8.dp))

          Button(
            onClick = { showScheduleModal = true },
            colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
              .fillMaxWidth()
              .defaultMinSize(minHeight = 48.dp)
              .testTag("btn_manage_weekly_hours")
          ) {
            Text(
              text = "🗓️  Manage Weekly Operating Hours",
              fontSize = 13.sp,
              fontWeight = FontWeight.Bold,
              color = Color.White
            )
          }

          Spacer(modifier = Modifier.height(12.dp))

          Text(
            text = "PICKUP SLOT INTERVALS",
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.8.sp
          )
          Spacer(modifier = Modifier.height(6.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            listOf(15, 30, 45, 60).forEach { mins ->
              val isSelected = storeConfig.slotIntervalMinutes == mins
              Surface(
                shape = RoundedCornerShape(6.dp),
                color = if (isSelected) AccentPrimary else CharcoalElevated,
                border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
                modifier = Modifier
                  .weight(1f)
                  .clickable {
                    viewModel.updateStoreSchedule(storeConfig.openingTime, storeConfig.closingTime, mins)
                  }
              ) {
                Box(modifier = Modifier.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                  Text(
                    text = "${mins}m",
                    color = if (isSelected) Color.White else TextSecondary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                  )
                }
              }
            }
          }
        }
      }

      // 3. Multi-Branch Switcher
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text(
            text = "MULTI-BRANCH ROUTING",
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 1.sp
          )
          Text(
            text = "Orders and stock updates are scoped strictly to the selected physical restaurant unit.",
            color = TextSecondary,
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
          )

          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            availableBranches.forEach { branch ->
              val isSelected = branch.id == activeBranch.id
              Surface(
                shape = RoundedCornerShape(12.dp),
                color = if (isSelected) AccentPrimary.copy(alpha = 0.1f) else CharcoalElevated,
                border = androidx.compose.foundation.BorderStroke(
                  1.dp,
                  if (isSelected) AccentPrimary else CharcoalBorder
                ),
                modifier = Modifier
                  .fillMaxWidth()
                  .defaultMinSize(minHeight = 48.dp)
                  .clickable { viewModel.setBranch(branch) }
                  .testTag("branch_item_${branch.code}")
              ) {
                Row(
                  modifier = Modifier.padding(12.dp),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Column {
                    Text(
                      text = branch.name,
                      color = if (isSelected) Color.White else TextPrimary,
                      fontWeight = FontWeight.Bold,
                      fontSize = 14.sp
                    )
                    Text(
                      text = branch.address,
                      color = TextMuted,
                      fontSize = 11.sp
                    )
                  }

                  Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (isSelected) AccentPrimary else CharcoalHighlight
                  ) {
                    Text(
                      text = branch.code,
                      color = if (isSelected) Color.White else TextSecondary,
                      fontSize = 11.sp,
                      fontWeight = FontWeight.ExtraBold,
                      modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                  }
                }
              }
            }
          }
        }
      }

      // 4. Real-time Connection Protocol & Offline Outbox Monitor
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text(
            text = "SYNC & DATA HEALTH",
            color = TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 1.sp
          )
          Spacer(modifier = Modifier.height(12.dp))

          Text(
            text = "Connection Protocol (Floor Simulation)",
            color = TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold
          )
          Spacer(modifier = Modifier.height(8.dp))

          Row(
            modifier = Modifier
              .fillMaxWidth()
              .background(CharcoalElevated, RoundedCornerShape(8.dp))
              .border(1.dp, CharcoalBorder, RoundedCornerShape(8.dp))
              .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
          ) {
            ConnectionStatus.values().forEach { mode ->
              val isSelected = mode == connectionStatus
              Box(
                modifier = Modifier
                  .weight(1f)
                  .clip(RoundedCornerShape(6.dp))
                  .background(if (isSelected) AccentPrimary else Color.Transparent)
                  .clickable { viewModel.setConnectionMode(mode) }
                  .defaultMinSize(minHeight = 36.dp)
                  .padding(vertical = 6.dp),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = if (mode == ConnectionStatus.POLLING) "POLL" else mode.name,
                  color = if (isSelected) Color.White else TextMuted,
                  fontSize = 11.sp,
                  fontWeight = FontWeight.ExtraBold
                )
              }
            }
          }

          Spacer(modifier = Modifier.height(16.dp))
          HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
          Spacer(modifier = Modifier.height(12.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Column(modifier = Modifier.weight(1f)) {
              Text(
                text = "Offline Outbox Queue",
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold
              )
              Text(
                text = if (outboxQueue.isEmpty()) "All actions synced to cloud" else "${outboxQueue.size} pending mutations",
                color = if (outboxQueue.isEmpty()) StatusSuccess else StatusWarning,
                fontSize = 12.sp
              )
            }

            Button(
              onClick = { viewModel.syncOutboxNow() },
              enabled = outboxQueue.isNotEmpty(),
              colors = ButtonDefaults.buttonColors(
                containerColor = StatusWarning,
                disabledContainerColor = CharcoalHighlight
              ),
              shape = RoundedCornerShape(8.dp),
              modifier = Modifier.defaultMinSize(minHeight = 48.dp).testTag("btn_sync_outbox")
            ) {
              Text(
                text = "SYNC NOW",
                color = if (outboxQueue.isNotEmpty()) TextInverse else TextMuted,
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold
              )
            }
          }

          Spacer(modifier = Modifier.height(12.dp))
          HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
          Spacer(modifier = Modifier.height(12.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Column {
              Text(
                text = "Audible New Ticket Chime",
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold
              )
              Text(
                text = "Loud audio alert on kitchen order receipt",
                color = TextMuted,
                fontSize = 11.sp
              )
            }

            Switch(
              checked = soundAlertsEnabled,
              onCheckedChange = { soundAlertsEnabled = it },
              colors = SwitchDefaults.colors(
                checkedThumbColor = AccentPrimary,
                checkedTrackColor = AccentPrimaryHover.copy(alpha = 0.3f),
                uncheckedThumbColor = Color(0xFFA1A1AA),
                uncheckedTrackColor = Color(0xFF3F3F46)
              )
            )
          }
        }
      }

      // 5. Logout Button
      OutlinedButton(
        onClick = { showLogoutConfirm = true },
        modifier = Modifier
          .fillMaxWidth()
          .defaultMinSize(minHeight = 48.dp)
          .testTag("btn_logout"),
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, StatusError.copy(alpha = 0.6f)),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusError)
      ) {
        Text(
          text = "SIGN OUT OF TERMINAL",
          fontSize = 14.sp,
          fontWeight = FontWeight.ExtraBold,
          letterSpacing = 0.5.sp
        )
      }

      Text(
        text = "BB Manager v1.2.0 • Store Operations Engine • PocketBase SSE Synchronized",
        color = TextMuted,
        fontSize = 10.sp,
        fontFamily = FontFamily.Monospace,
        modifier = Modifier.align(Alignment.CenterHorizontally)
      )
    }
  }

  if (showLogoutConfirm) {
    AlertDialog(
      onDismissRequest = { showLogoutConfirm = false },
      containerColor = CharcoalSurface,
      title = { Text("Sign Out", color = TextPrimary, fontWeight = FontWeight.Bold) },
      text = { Text("Are you sure you want to end your kitchen session?", color = TextSecondary) },
      confirmButton = {
        Button(
          onClick = {
            showLogoutConfirm = false
            viewModel.logout()
          },
          colors = ButtonDefaults.buttonColors(containerColor = StatusError)
        ) {
          Text("Sign Out")
        }
      },
      dismissButton = {
        TextButton(onClick = { showLogoutConfirm = false }) {
          Text("Cancel", color = TextSecondary)
        }
      }
    )
  }

  if (showScheduleModal) {
    var localSchedule by remember(storeConfig.weeklySchedule) {
      mutableStateOf(storeConfig.weeklySchedule.map { it.copy() })
    }

    AlertDialog(
      onDismissRequest = { showScheduleModal = false },
      containerColor = CharcoalSurface,
      title = {
        Text(
          text = "Weekly Operating Hours (7 Days)",
          color = TextPrimary,
          fontSize = 18.sp,
          fontWeight = FontWeight.Bold
        )
      },
      text = {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 400.dp)
            .verticalScroll(rememberScrollState()),
          verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          Text(
            text = "Set dedicated opening & closing hours for each day of the week.",
            color = TextMuted,
            fontSize = 12.sp
          )

          localSchedule.forEachIndexed { index, day ->
            Surface(
              shape = RoundedCornerShape(10.dp),
              color = CharcoalElevated,
              border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(10.dp)) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Text(
                    text = day.day,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                  )
                  Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                      text = if (day.isOpen) "OPEN" else "CLOSED",
                      color = if (day.isOpen) StatusSuccess else StatusError,
                      fontSize = 11.sp,
                      fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Switch(
                      checked = day.isOpen,
                      onCheckedChange = { isOpen ->
                        localSchedule = localSchedule.toMutableList().also {
                          it[index] = it[index].copy(isOpen = isOpen)
                        }
                      },
                      colors = SwitchDefaults.colors(
                        checkedThumbColor = StatusSuccess,
                        checkedTrackColor = StatusSuccessMuted,
                        uncheckedThumbColor = StatusError,
                        uncheckedTrackColor = StatusErrorMuted
                      )
                    )
                  }
                }

                if (day.isOpen) {
                  Spacer(modifier = Modifier.height(6.dp))
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                  ) {
                    OutlinedTextField(
                      value = day.openTime,
                      onValueChange = { newTime ->
                        localSchedule = localSchedule.toMutableList().also {
                          it[index] = it[index].copy(openTime = newTime)
                        }
                      },
                      label = { Text("Open", fontSize = 10.sp) },
                      modifier = Modifier.weight(1f),
                      colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                      ),
                      singleLine = true
                    )
                    OutlinedTextField(
                      value = day.closeTime,
                      onValueChange = { newTime ->
                        localSchedule = localSchedule.toMutableList().also {
                          it[index] = it[index].copy(closeTime = newTime)
                        }
                      },
                      label = { Text("Close", fontSize = 10.sp) },
                      modifier = Modifier.weight(1f),
                      colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                      ),
                      singleLine = true
                    )
                  }
                }
              }
            }
          }
        }
      },
      confirmButton = {
        Button(
          onClick = {
            viewModel.updateWeeklySchedule(localSchedule)
            showScheduleModal = false
          },
          colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
        ) {
          Text("Save Weekly Schedule", color = Color.White)
        }
      },
      dismissButton = {
        TextButton(onClick = { showScheduleModal = false }) {
          Text("Cancel", color = TextSecondary)
        }
      }
    )
  }
}
