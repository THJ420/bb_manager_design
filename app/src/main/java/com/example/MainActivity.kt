package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.TableRestaurant
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.model.OrderStatus
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

import androidx.compose.material.icons.filled.Analytics

enum class MainTab(val title: String, val icon: ImageVector) {
  ORDERS("Live Orders", Icons.Default.List),
  MENU("Menu & Stock", Icons.Default.Restaurant),
  TABLES("Dining Tables", Icons.Default.TableRestaurant),
  ANALYTICS("Analytics", Icons.Default.Analytics),
  SETTINGS("Settings", Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        val vm: BBManagerViewModel = viewModel()
        val isLoggedIn by vm.isLoggedIn.collectAsState()
        var currentTab by remember { mutableStateOf(MainTab.ORDERS) }
        val orders by vm.orders.collectAsState()

        // Active orders badge (New + Preparing)
        val activeCount = remember(orders) {
          orders.count { it.status == OrderStatus.NEW || it.status == OrderStatus.PREPARING }
        }

        if (!isLoggedIn) {
          Scaffold(
            contentWindowInsets = WindowInsets.safeDrawing,
            containerColor = CharcoalBackground
          ) { innerPadding ->
            LoginScreen(
              viewModel = vm,
              modifier = Modifier.padding(innerPadding)
            )
          }
        } else {
          // Hardware Back button handling
          BackHandler(enabled = currentTab != MainTab.ORDERS) {
            currentTab = MainTab.ORDERS
          }

          Scaffold(
            contentWindowInsets = WindowInsets.safeDrawing,
            containerColor = CharcoalBackground,
            bottomBar = {
              // Icon-Only Compact Navigation Footer Bar per Design Specification
              Surface(
                color = CharcoalSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
                modifier = Modifier
                  .fillMaxWidth()
                  .windowInsetsPadding(WindowInsets.navigationBars)
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .padding(horizontal = 8.dp),
                  horizontalArrangement = Arrangement.SpaceAround,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  MainTab.values().forEach { tab ->
                    val isSelected = currentTab == tab
                    val tabColor = if (isSelected) AccentPrimary else TextMuted

                    // Elegant Icon-Only Button with glowing active container (>= 48dp touch target)
                    Surface(
                      onClick = { currentTab = tab },
                      color = if (isSelected) AccentPrimary.copy(alpha = 0.16f) else Color.Transparent,
                      shape = RoundedCornerShape(14.dp),
                      border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, AccentPrimary.copy(alpha = 0.4f)) else null,
                      modifier = Modifier
                        .size(48.dp)
                        .testTag("tab_${tab.name.lowercase()}")
                    ) {
                      Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                      ) {
                        BadgedBox(
                          badge = {
                            if (tab == MainTab.ORDERS && activeCount > 0) {
                              Badge(
                                containerColor = StatusWarning,
                                contentColor = TextInverse,
                                modifier = Modifier.offset(x = 6.dp, y = (-4).dp)
                              ) {
                                Text(
                                  text = activeCount.toString(),
                                  fontWeight = FontWeight.Bold,
                                  fontSize = 9.sp
                                )
                              }
                            }
                          }
                        ) {
                          Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.title,
                            tint = tabColor,
                            modifier = Modifier.size(24.dp)
                          )
                        }

                        // Bottom glowing active dot
                        if (isSelected) {
                          Box(
                            modifier = Modifier
                              .align(Alignment.BottomCenter)
                              .padding(bottom = 3.dp)
                              .size(4.dp)
                              .clip(CircleShape)
                              .background(AccentPrimary)
                          )
                        }
                      }
                    }
                  }
                }
              }
            }
          ) { innerPadding ->
            Box(
              modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
            ) {
              when (currentTab) {
                MainTab.ORDERS -> OrdersScreen(viewModel = vm)
                MainTab.MENU -> MenuScreen(viewModel = vm)
                MainTab.TABLES -> TablesScreen(viewModel = vm)
                MainTab.ANALYTICS -> AnalyticsScreen(viewModel = vm)
                MainTab.SETTINGS -> SettingsScreen(viewModel = vm)
              }
            }
          }
        }
      }
    }
  }
}
