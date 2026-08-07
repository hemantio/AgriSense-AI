import 'package:flutter/material.dart';
import 'package:farmerapp/services/api_service.dart';
import 'package:farmerapp/screens/login_screen.dart';
import 'package:farmerapp/screens/scan_screen.dart';
import 'package:farmerapp/screens/plots_screen.dart';
import 'package:farmerapp/screens/logs_screen.dart';
import 'package:flutter_tts/flutter_tts.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  final List<String> _titles = [
    'AgriSense Farmer',
    'AI Crop Clinic',
    'Field Plots Registry',
    'Log Activity Ledger',
  ];

  late List<Widget> _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = [
      const _HomeTab(),
      const ScanScreen(),
      const PlotsScreen(),
      const LogsScreen(),
    ];
  }

  Future<void> _handleLogout() async {
    await ApiService.clearTokens();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030303), // Absolute Soil base
      appBar: AppBar(
        backgroundColor: const Color(0xFF09090B),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.spa, color: Color(0xFF030303), size: 14),
            ),
            const SizedBox(width: 8),
            Text(
              _titles[_currentIndex],
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _handleLogout,
            icon: const Icon(Icons.logout, color: Color(0xFF52525B), size: 18),
            tooltip: 'Logout',
          )
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: _tabs[_currentIndex],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF09090B),
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: const Color(0xFF52525B),
        selectedFontSize: 9,
        unselectedFontSize: 9,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt_outlined), activeIcon: Icon(Icons.camera_alt), label: 'Scan'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), activeIcon: Icon(Icons.map), label: 'Plots'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment), label: 'Logs'),
        ],
      ),
    );
  }
}

// Inner Home tab dashboard view
class _HomeTab extends StatefulWidget {
  const _HomeTab();

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _weather;
  bool _loading = true;
  int _plotsCount = 0;
  int _cropsCount = 0;

  // TTS
  final FlutterTts _tts = FlutterTts();
  bool _isSpeaking = false;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
    _initTts();
  }

  void _initTts() {
    _tts.setStartHandler(() {
      setState(() => _isSpeaking = true);
    });
    _tts.setCompletionHandler(() {
      setState(() => _isSpeaking = false);
    });
    _tts.setErrorHandler((msg) {
      setState(() => _isSpeaking = false);
    });
  }

  Future<void> _loadDashboardData() async {
    try {
      final cachedUser = await ApiService.getCachedUser();
      setState(() {
        _user = cachedUser;
      });

      final statsData = await ApiService.getDashboardStats();
      final plotsData = await ApiService.listPlots();
      final cropsData = await ApiService.listCrops();

      final plots = plotsData['plots'] ?? [];
      final crops = cropsData['crops'] ?? [];

      setState(() {
        _stats = statsData;
        _plotsCount = plots.length;
        _cropsCount = crops.length;
      });

      // Load weather forecast based on coordinates
      double lat = 28.9812;
      double lon = 77.0123;
      if (plots.isNotEmpty && plots[0]['latitude'] != null) {
        lat = double.parse(plots[0]['latitude'].toString());
        lon = double.parse(plots[0]['longitude'].toString());
      }

      final weatherData = await ApiService.getWeatherForecast(lat, lon);
      setState(() {
        _weather = weatherData['current'];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _speakAdvisory() async {
    if (_isSpeaking) {
      await _tts.stop();
      setState(() => _isSpeaking = false);
      return;
    }

    final isHindi = _user?['preferred_language'] == 'hi';
    String text = '';

    if (isHindi) {
      text = 'नमस्ते ${_user?['name'] ?? 'किसान भाई'}. आपका स्वागत है एग्रीसेंस एआई में. ';
      if (_weather != null) {
        text += 'आज का तापमान ${(_weather!['temperature_celsius'] ?? 30).toString().split('.')[0]} डिग्री सेल्सियस है. ';
        if (_weather!['rain_probability'] != null && _weather!['rain_probability'] > 30) {
          text += 'आज बारिश की संभावना है, खाद डालने से बचें. ';
        }
      }
      if (_stats?['critical_health_alerts'] != null && _stats!['critical_health_alerts'] > 0) {
        text += 'आपके खेत में ${_stats!['critical_health_alerts']} फसल रोग अलर्ट हैं. पत्तों की जांच करें. ';
      } else {
        text += 'आपकी फसलें स्वस्थ हैं. ';
      }
    } else {
      text = 'Hello ${_user?['name'] ?? 'farmer'}. Welcome to AgriSense AI. ';
      if (_weather != null) {
        text += 'Temperature is ${(_weather!['temperature_celsius'] ?? 30).toString().split('.')[0]} degrees Celsius. ';
        if (_weather!['rain_probability'] != null && _weather!['rain_probability'] > 30) {
          text += 'Rain is expected. Avoid fertilizer application. ';
        }
      }
      if (_stats?['critical_health_alerts'] != null && _stats!['critical_health_alerts'] > 0) {
        text += 'You have ${_stats!['critical_health_alerts']} critical crop warnings. Please inspect your fields. ';
      } else {
        text += 'Your crops look healthy. ';
      }
    }

    await _tts.setLanguage(isHindi ? 'hi-IN' : 'en-US');
    await _tts.setSpeechRate(0.48);
    await _tts.speak(text);
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));
    }

    final isHindi = _user?['preferred_language'] == 'hi';

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Greeting
          Text(
            isHindi ? 'किसान पोर्टल' : 'FARMER PORTAL',
            style: const TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            '${isHindi ? "नमस्ते" : "Welcome"}, ${_user?['name'] ?? "Ramesh"}!',
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 2),
          Text(
            'Village: ${_user?['village_name'] ?? "Sonipat"}',
            style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 11),
          ),
          const SizedBox(height: 20),

          // TTS Card (Orchid)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF09090B),
              border: Border.all(color: const Color(0xFF18181B)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'VOICE ADVISORY',
                        style: TextStyle(color: Color(0xFF52525B), fontSize: 8, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isHindi 
                          ? 'मौसम और फसल स्थिति सुनने के लिए बटन दबाएं।' 
                          : 'Listen to weather forecasts and crop alerts.',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      )
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: _speakAdvisory,
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB1EE),
                    foregroundColor: const Color(0xFF030303),
                    padding: const EdgeInsets.all(14),
                  ),
                  icon: Icon(_isSpeaking ? Icons.square : Icons.play_arrow, size: 22),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Scan Trigger Button (Living Emerald)
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF065F46), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  // Switch to Scanner tab
                  final parentState = context.findAncestorStateOfType<_DashboardScreenState>();
                  if (parentState != null) {
                    parentState.setState(() {
                      parentState._currentIndex = 1;
                    });
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isHindi ? 'फसल रोग स्कैन करें' : 'Scan Crop Diseases',
                              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isHindi ? 'पत्ती की फोटो लेकर तुरंत सलाह पाएं' : 'Take leaf photo to detect disease',
                              style: const TextStyle(color: Color(0xFFD1FAE5), fontSize: 10),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Weather telemetry metrics
          if (_weather != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF09090B),
                border: Border.all(color: const Color(0xFF18181B)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'WEATHER INTELLIGENCE',
                        style: TextStyle(color: Color(0xFF52525B), fontSize: 8, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withOpacity(0.08),
                          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.15)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${(_weather!['rain_probability'] ?? 0).toString().split('.')[0]}% RAIN PROB',
                          style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 8, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      // Temp
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFF18181B).withOpacity(0.5), borderRadius: BorderRadius.circular(8)),
                          child: Column(
                            children: [
                              const Icon(Icons.thermostat, color: Color(0xFFFCA5A5), size: 16),
                              const SizedBox(height: 4),
                              const Text('TEMP', style: TextStyle(color: Color(0xFF52525B), fontSize: 8, fontFamily: 'monospace')),
                              const SizedBox(height: 4),
                              Text('${(_weather!['temperature_celsius'] ?? 30).toString().split('.')[0]}°C', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Humid
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFF18181B).withOpacity(0.5), borderRadius: BorderRadius.circular(8)),
                          child: Column(
                            children: [
                              const Icon(Icons.water_drop, color: Color(0xFF93C5FD), size: 16),
                              const SizedBox(height: 4),
                              const Text('HUMIDITY', style: TextStyle(color: Color(0xFF52525B), fontSize: 8, fontFamily: 'monospace')),
                              const SizedBox(height: 4),
                              Text('${_weather!['humidity_percent']}%', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Wind
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFF18181B).withOpacity(0.5), borderRadius: BorderRadius.circular(8)),
                          child: Column(
                            children: [
                              const Icon(Icons.air, color: Color(0xFF99F6E4), size: 16),
                              const SizedBox(height: 4),
                              const Text('WIND', style: TextStyle(color: Color(0xFF52525B), fontSize: 8, fontFamily: 'monospace')),
                              const SizedBox(height: 4),
                              Text('${(_weather!['wind_speed_kmh'] ?? 10).toString().split('.')[0]} km/h', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Quick stats
          const Text(
            'FARM LEDGER STATS',
            style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 2.2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            children: [
              _buildStatTile(Icons.map, 'Fields', '$_plotsCount Plots', const Color(0xFF2DD4BF)),
              _buildStatTile(Icons.grass, 'Crops', '$_cropsCount Active', const Color(0xFFFBBF24)),
              _buildStatTile(Icons.warning_amber, 'Alerts', '${_stats?['critical_health_alerts'] ?? 0} Critical', const Color(0xFFF87171)),
              _buildStatTile(Icons.payments, 'Expenses', '₹${(_stats?['total_expenses'] ?? 0).toString().split('.')[0]}', const Color(0xFF34D399)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatTile(IconData icon, String title, String val, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF09090B),
        border: Border.all(color: const Color(0xFF18181B)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title.toUpperCase(),
                  style: const TextStyle(color: Color(0xFF52525B), fontSize: 8, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  val,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
