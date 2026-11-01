package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.MenuItem
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun MenuScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  val menuItems by viewModel.menuItems.collectAsState()
  val selectedCategory by viewModel.selectedMenuCategory.collectAsState()
  val searchQuery by viewModel.menuSearchQuery.collectAsState()
  val activeBranch by viewModel.activeBranch.collectAsState()

  var showCreateDialog by remember { mutableStateOf(false) }
  var itemBeingEdited by remember { mutableStateOf<MenuItem?>(null) }

  val filteredItems = remember(menuItems, selectedCategory, searchQuery) {
    menuItems.filter { item ->
      val matchesCategory = selectedCategory == "All" || item.category.equals(selectedCategory, ignoreCase = true)
      val matchesQuery = searchQuery.isBlank() ||
        item.name.contains(searchQuery, ignoreCase = true) ||
        item.description.contains(searchQuery, ignoreCase = true)
      matchesCategory && matchesQuery
    }
  }

  val categoryOptions = remember(menuItems) {
    val categories = listOf("All", "Burgers", "Sides", "Beverages", "Desserts")
    categories.map { cat ->
      val count = if (cat == "All") menuItems.size else menuItems.count { it.category.equals(cat, ignoreCase = true) }
      FilterChipData(cat, cat, count)
    }
  }

  val inStockCount = remember(menuItems) { menuItems.count { it.inStock } }

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
      Column(modifier = Modifier.weight(1f)) {
        Text(
          text = "Menu & Stock",
          color = TextPrimary,
          fontSize = 20.sp,
          fontWeight = FontWeight.Black,
          letterSpacing = (-0.5).sp
        )
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          modifier = Modifier.padding(top = 2.dp)
        ) {
          Text(
            text = activeBranch.name,
            color = TextMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
          )
          Text(text = "•", color = TextMuted, fontSize = 12.sp)
          Text(
            text = "$inStockCount / ${menuItems.size} IN STOCK",
            color = StatusSuccess,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
          )
        }
      }

      Button(
        onClick = { showCreateDialog = true },
        colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
          .defaultMinSize(minHeight = 44.dp)
          .padding(start = 8.dp)
          .testTag("btn_add_menu_item")
      ) {
        Text("+ ADD ITEM", fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
        onValueChange = { viewModel.setMenuSearchQuery(it) },
        placeholder = { Text("Search items or ingredients...", color = TextMuted) },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
          focusedBorderColor = AccentPrimary,
          unfocusedBorderColor = CharcoalBorder,
          focusedTextColor = TextPrimary,
          unfocusedTextColor = TextPrimary,
          focusedContainerColor = CharcoalElevated,
          unfocusedContainerColor = CharcoalElevated
        ),
        modifier = Modifier
          .fillMaxWidth()
          .defaultMinSize(minHeight = 48.dp)
          .testTag("menu_search_input")
      )
    }

    // Horizontal Category Filter Chips
    HorizontalFilterChips(
      options = categoryOptions,
      selectedId = selectedCategory,
      onSelect = { viewModel.setMenuCategory(it) }
    )

    // Items List
    LazyColumn(
      modifier = Modifier.fillMaxSize(),
      contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
      items(filteredItems, key = { it.id }) { item ->
        MenuItemCard(
          item = item,
          onToggleStock = { inStock -> viewModel.toggleMenuItemStock(item.id, inStock) },
          onEditPrice = { itemBeingEdited = item }
        )
      }
    }
  }

  // Full Menu Item CRUD Modal Dialog (Handles both Create and Edit)
  val editingTarget = itemBeingEdited
  if (showCreateDialog || editingTarget != null) {
    var name by remember(editingTarget?.id) { mutableStateOf(editingTarget?.name ?: "") }
    var category by remember(editingTarget?.id) { mutableStateOf(editingTarget?.category ?: "Burgers") }
    var description by remember(editingTarget?.id) { mutableStateOf(editingTarget?.description ?: "") }
    var imageUrl by remember(editingTarget?.id) { mutableStateOf(editingTarget?.imageUrl ?: "") }
    var priceText by remember(editingTarget?.id) {
      mutableStateOf(if (editingTarget != null) String.format("%.2f", editingTarget.price) else "12.50")
    }
    var inStock by remember(editingTarget?.id) { mutableStateOf(editingTarget?.inStock ?: true) }
    var isVisible by remember(editingTarget?.id) { mutableStateOf(editingTarget?.isVisible ?: true) }

    AlertDialog(
      onDismissRequest = {
        showCreateDialog = false
        itemBeingEdited = null
      },
      containerColor = CharcoalSurface,
      shape = RoundedCornerShape(16.dp),
      title = {
        Text(
          text = if (editingTarget == null) "Add Menu Item" else "Edit Menu Item",
          color = TextPrimary,
          fontWeight = FontWeight.Bold,
          fontSize = 18.sp
        )
      },
      text = {
        LazyColumn(
          modifier = Modifier.fillMaxWidth(),
          verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          item {
            OutlinedTextField(
              value = name,
              onValueChange = { name = it },
              label = { Text("Item Name*") },
              singleLine = true,
              colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AccentPrimary,
                unfocusedBorderColor = CharcoalBorder,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
              ),
              modifier = Modifier.fillMaxWidth().testTag("input_item_name")
            )
          }

          item {
            Text("Category", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(4.dp))
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
              listOf("Burgers", "Sides", "Beverages", "Desserts").forEach { cat ->
                Surface(
                  shape = RoundedCornerShape(6.dp),
                  color = if (category == cat) AccentPrimary else CharcoalElevated,
                  border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
                  modifier = Modifier
                    .weight(1f)
                    .clickable { category = cat }
                ) {
                  Box(modifier = Modifier.padding(vertical = 6.dp), contentAlignment = Alignment.Center) {
                    Text(
                      text = cat,
                      color = if (category == cat) Color.White else TextSecondary,
                      fontSize = 10.sp,
                      fontWeight = FontWeight.Bold
                    )
                  }
                }
              }
            }
          }

          item {
            OutlinedTextField(
              value = description,
              onValueChange = { description = it },
              label = { Text("Short Description / Ingredients") },
              minLines = 2,
              maxLines = 3,
              colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AccentPrimary,
                unfocusedBorderColor = CharcoalBorder,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
              ),
              modifier = Modifier.fillMaxWidth().testTag("input_item_desc")
            )
          }

          item {
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(CharcoalElevated)
                .border(1.dp, CharcoalBorder, RoundedCornerShape(12.dp))
                .padding(12.dp)
            ) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Text(
                  text = "ITEM PHOTO & MEDIA ASSET",
                  color = TextMuted,
                  fontSize = 11.sp,
                  fontWeight = FontWeight.Bold,
                  letterSpacing = 0.5.sp
                )
                if (imageUrl.isNotBlank()) {
                  TextButton(
                    onClick = { imageUrl = "" },
                    contentPadding = PaddingValues(0.dp)
                  ) {
                    Text("Clear", color = StatusError, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                  }
                }
              }

              Spacer(modifier = Modifier.height(6.dp))

              if (imageUrl.isNotBlank()) {
                Surface(
                  shape = RoundedCornerShape(8.dp),
                  color = CharcoalSurface,
                  border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
                  modifier = Modifier.fillMaxWidth()
                ) {
                  Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                  ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                      Text("Photo Attached", color = StatusSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                      Text(imageUrl, color = TextMuted, fontSize = 10.sp, maxLines = 1)
                    }
                    Button(
                      onClick = {
                        val presets = listOf(
                          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
                          "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600",
                          "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600",
                          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600"
                        )
                        imageUrl = presets.random()
                      },
                      colors = ButtonDefaults.buttonColors(containerColor = CharcoalHighlight),
                      shape = RoundedCornerShape(6.dp),
                      contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                      Text("Retake", color = TextPrimary, fontSize = 11.sp)
                    }
                  }
                }
              } else {
                Text(
                  text = "Attach item photo via camera capture or device gallery:",
                  color = TextMuted,
                  fontSize = 11.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                  Button(
                    onClick = {
                      imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f).defaultMinSize(minHeight = 40.dp)
                  ) {
                    Text("📷 Snap Photo", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                  }

                  Button(
                    onClick = {
                      imageUrl = "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600"
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CharcoalHighlight),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
                    modifier = Modifier.weight(1f).defaultMinSize(minHeight = 40.dp)
                  ) {
                    Text("📁 Upload Device", color = TextPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                  }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Presets row
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                  listOf(
                    "🍔 Burger" to "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
                    "🍗 Chicken" to "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600",
                    "🍟 Fries" to "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600"
                  ).forEach { (lbl, url) ->
                    Surface(
                      shape = RoundedCornerShape(12.dp),
                      color = CharcoalHighlight,
                      border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
                      modifier = Modifier.clickable { imageUrl = url }
                    ) {
                      Text(
                        text = lbl,
                        color = TextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                      )
                    }
                  }
                }
              }
            }
          }

          item {
            OutlinedTextField(
              value = priceText,
              onValueChange = { priceText = it },
              label = { Text("Price ($ USD)*") },
              prefix = { Text("$", color = TextMuted, fontWeight = FontWeight.Bold) },
              singleLine = true,
              colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AccentPrimary,
                unfocusedBorderColor = CharcoalBorder,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
              ),
              modifier = Modifier.fillMaxWidth().testTag("input_item_price")
            )
          }

          item {
            HorizontalDivider(color = CharcoalBorder, thickness = 1.dp)
            Spacer(modifier = Modifier.height(6.dp))

            // Stock status toggle
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Column {
                Text("Stock Status", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(
                  if (inStock) "Available on POS & kitchen floor" else "Marked 86 / Sold Out",
                  color = if (inStock) StatusSuccess else StatusError,
                  fontSize = 11.sp
                )
              }
              Switch(
                checked = inStock,
                onCheckedChange = { inStock = it },
                colors = SwitchDefaults.colors(
                  checkedThumbColor = StatusSuccess,
                  checkedTrackColor = StatusSuccessMuted,
                  uncheckedThumbColor = Color(0xFFA1A1AA),
                  uncheckedTrackColor = Color(0xFF3F3F46)
                )
              )
            }
          }

          item {
            // Visibility on website toggle
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Column {
                Text("Website Visibility", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(
                  if (isVisible) "Visible for online customer ordering" else "Hidden from web & pickup menu",
                  color = if (isVisible) AccentPrimary else TextMuted,
                  fontSize = 11.sp
                )
              }
              Switch(
                checked = isVisible,
                onCheckedChange = { isVisible = it },
                colors = SwitchDefaults.colors(
                  checkedThumbColor = AccentPrimary,
                  checkedTrackColor = AccentPrimary.copy(alpha = 0.35f),
                  uncheckedThumbColor = Color(0xFFA1A1AA),
                  uncheckedTrackColor = Color(0xFF3F3F46)
                )
              )
            }
          }
        }
      },
      confirmButton = {
        Button(
          onClick = {
            if (name.isNotBlank()) {
              val priceVal = priceText.toDoubleOrNull() ?: 12.0
              if (editingTarget != null) {
                val updated = editingTarget.copy(
                  name = name.trim(),
                  category = category,
                  description = description.trim().ifEmpty { "Fresh kitchen preparation" },
                  imageUrl = imageUrl.trim().ifEmpty { null },
                  price = priceVal,
                  inStock = inStock,
                  isVisible = isVisible
                )
                viewModel.updateMenuItem(updated)
              } else {
                val item = MenuItem(
                  id = "m_${System.currentTimeMillis()}",
                  branchId = activeBranch.id,
                  name = name.trim(),
                  category = category,
                  description = description.trim().ifEmpty { "Fresh kitchen preparation" },
                  imageUrl = imageUrl.trim().ifEmpty { null },
                  price = priceVal,
                  inStock = inStock,
                  isVisible = isVisible,
                  preparationMinutes = 10
                )
                viewModel.addMenuItem(item)
              }
              showCreateDialog = false
              itemBeingEdited = null
            }
          },
          colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
        ) {
          Text(if (editingTarget != null) "Update Item" else "Add Item", fontWeight = FontWeight.Bold)
        }
      },
      dismissButton = {
        TextButton(
          onClick = {
            showCreateDialog = false
            itemBeingEdited = null
          }
        ) {
          Text("Cancel", color = TextSecondary)
        }
      }
    )
  }
}
