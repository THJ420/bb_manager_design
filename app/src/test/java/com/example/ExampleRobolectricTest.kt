package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.model.OrderStatus
import com.example.viewmodel.BBManagerViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("BB Manager", appName)
  }

  @Test
  fun `verify order status transition and stock toggling`() {
    val vm = BBManagerViewModel()
    val firstOrder = vm.orders.value.first()
    assertEquals(OrderStatus.NEW, firstOrder.status)

    // Transition to preparing
    vm.updateOrderStatus(firstOrder.id, OrderStatus.PREPARING)
    assertEquals(OrderStatus.PREPARING, vm.orders.value.first().status)

    // Stock toggle
    val firstItem = vm.menuItems.value.first()
    assertTrue(firstItem.inStock)
    vm.toggleMenuItemStock(firstItem.id, false)
    assertFalse(vm.menuItems.value.first().inStock)
  }
}
