package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.viewmodel.BBManagerViewModel

@Composable
fun LoginScreen(
  viewModel: BBManagerViewModel,
  modifier: Modifier = Modifier
) {
  var email by remember { mutableStateOf("manager.downtown@bbmanager.internal") }
  var password by remember { mutableStateOf("manager1234") }
  var branchCode by remember { mutableStateOf("DT-01") }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  Box(
    modifier = modifier
      .fillMaxSize()
      .background(CharcoalBackground)
      .padding(16.dp),
    contentAlignment = Alignment.Center
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .widthIn(max = 440.dp)
        .verticalScroll(rememberScrollState()),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      // Brand Header
      Box(
        modifier = Modifier
          .size(56.dp)
          .clip(RoundedCornerShape(16.dp))
          .background(AccentPrimary)
          .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
        contentAlignment = Alignment.Center
      ) {
        Text(
          text = "BB",
          color = Color.White,
          fontSize = 24.sp,
          fontWeight = FontWeight.Black
        )
      }

      Spacer(modifier = Modifier.height(12.dp))

      Text(
        text = "BB MANAGER",
        color = TextPrimary,
        fontSize = 22.sp,
        fontWeight = FontWeight.Black,
        letterSpacing = 1.5.sp
      )

      Text(
        text = "Multi-Branch Restaurant Pickup Terminal",
        color = TextMuted,
        fontSize = 12.sp,
        modifier = Modifier.padding(top = 2.dp)
      )

      Spacer(modifier = Modifier.height(24.dp))

      // Card Container
      Card(
        modifier = Modifier
          .fillMaxWidth()
          .testTag("login_card"),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CharcoalBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
      ) {
        Column(modifier = Modifier.padding(20.dp)) {
          Text(
            text = "Staff Sign In",
            color = TextPrimary,
            fontSize = 18.sp,
            fontWeight = FontWeight.ExtraBold
          )
          Text(
            text = "Enter your assigned restaurant credentials",
            color = TextSecondary,
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
          )

          if (errorMessage != null) {
            Surface(
              shape = RoundedCornerShape(8.dp),
              color = StatusErrorMuted,
              border = androidx.compose.foundation.BorderStroke(1.dp, StatusError),
              modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
            ) {
              Text(
                text = errorMessage!!,
                color = StatusError,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(10.dp)
              )
            }
          }

          // Email Input
          OutlinedTextField(
            value = email,
            onValueChange = {
              email = it
              errorMessage = null
            },
            label = { Text("Staff Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            colors = OutlinedTextFieldDefaults.colors(
              focusedBorderColor = AccentPrimary,
              unfocusedBorderColor = CharcoalBorder,
              focusedTextColor = TextPrimary,
              unfocusedTextColor = TextPrimary
            ),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("login_email_input")
          )

          Spacer(modifier = Modifier.height(12.dp))

          // Password Input
          OutlinedTextField(
            value = password,
            onValueChange = {
              password = it
              errorMessage = null
            },
            label = { Text("Password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            colors = OutlinedTextFieldDefaults.colors(
              focusedBorderColor = AccentPrimary,
              unfocusedBorderColor = CharcoalBorder,
              focusedTextColor = TextPrimary,
              unfocusedTextColor = TextPrimary
            ),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("login_password_input")
          )

          Spacer(modifier = Modifier.height(12.dp))

          // Branch Code Input
          OutlinedTextField(
            value = branchCode,
            onValueChange = {
              branchCode = it.uppercase()
              errorMessage = null
            },
            label = { Text("Branch Code (e.g. DT-01, UB-02)") },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
              focusedBorderColor = AccentPrimary,
              unfocusedBorderColor = CharcoalBorder,
              focusedTextColor = TextPrimary,
              unfocusedTextColor = TextPrimary
            ),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("login_branch_input")
          )

          Spacer(modifier = Modifier.height(20.dp))

          // Submit Button (>= 48dp)
          Button(
            onClick = {
              if (email.isBlank() || password.isBlank()) {
                errorMessage = "Please enter both email and password."
              } else if (branchCode.isBlank()) {
                errorMessage = "Branch Code is required for local pickup routing."
              } else {
                viewModel.login(email.trim(), branchCode.trim())
              }
            },
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(min = 48.dp)
              .testTag("login_submit_btn"),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
          ) {
            Text(
              text = "ENTER DASHBOARD",
              color = Color.White,
              fontWeight = FontWeight.ExtraBold,
              fontSize = 14.sp
            )
          }

          Spacer(modifier = Modifier.height(10.dp))

          TextButton(
            onClick = {
              email = "manager.downtown@bbmanager.internal"
              password = "manager1234"
              branchCode = "DT-01"
              errorMessage = null
            },
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(min = 48.dp)
              .testTag("login_demo_btn")
          ) {
            Text(
              text = "Use Default Demo Credentials",
              color = AccentPrimary,
              fontSize = 13.sp,
              fontWeight = FontWeight.SemiBold
            )
          }
        }
      }

      Spacer(modifier = Modifier.height(20.dp))
      Text(
        text = "PocketBase AsyncAuthStore • Local SQLite Outbox Ready",
        color = TextMuted,
        fontSize = 11.sp,
        fontFamily = FontFamily.Monospace
      )
    }
  }
}
