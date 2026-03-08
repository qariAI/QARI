# Add this line to keep the Native Google Auth plugin from being stripped in Release builds
-keep class app.qari.ai.NativeGoogleAuthPlugin { *; }
-keep public class * extends com.getcapacitor.Plugin
