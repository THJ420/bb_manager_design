package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val BBManagerDarkColorScheme = darkColorScheme(
  primary = AccentPrimary,
  onPrimary = TextPrimary,
  secondary = AccentSlate,
  onSecondary = TextPrimary,
  tertiary = StatusSuccess,
  background = CharcoalBackground,
  onBackground = TextPrimary,
  surface = CharcoalSurface,
  onSurface = TextPrimary,
  surfaceVariant = CharcoalElevated,
  onSurfaceVariant = TextSecondary,
  outline = CharcoalBorder,
  error = StatusError,
  onError = TextPrimary,
)

@Composable
fun MyApplicationTheme(
  content: @Composable () -> Unit,
) {
  MaterialTheme(
    colorScheme = BBManagerDarkColorScheme,
    typography = Typography,
    content = content
  )
}
