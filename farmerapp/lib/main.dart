import 'package:flutter/material.dart';
import 'package:farmerapp/services/api_service.dart';
import 'package:farmerapp/screens/login_screen.dart';
import 'package:farmerapp/screens/dashboard_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.loadBaseUrl();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool _checkingAuth = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final token = await ApiService.getAccessToken();
      setState(() {
        _isAuthenticated = token != null;
        _checkingAuth = false;
      });
    } catch (_) {
      setState(() {
        _checkingAuth = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriSense Farmer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF10B981), // Living Emerald
        scaffoldBackgroundColor: const Color(0xFF030303), // Absolute Soil
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFFFFB1EE), // Orchid
          surface: Color(0xFF09090B),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Color(0xFFA1A1AA)),
        ),
      ),
      home: _checkingAuth
          ? const Scaffold(
              backgroundColor: Color(0xFF030303),
              body: Center(
                child: CircularProgressIndicator(color: Color(0xFF10B981)),
              ),
            )
          : _isAuthenticated
              ? const DashboardScreen()
              : const LoginScreen(),
    );
  }
}
