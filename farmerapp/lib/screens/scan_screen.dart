import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:farmerapp/services/api_service.dart';
import 'package:flutter_tts/flutter_tts.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _imageFile;
  List<dynamic> _plots = [];
  String? _selectedPlotId;
  
  bool _isLoadingPlots = true;
  bool _isAnalyzing = false;
  List<String> _logs = [];
  Map<String, dynamic>? _result;
  String _errorMessage = '';

  // TTS
  final FlutterTts _tts = FlutterTts();
  bool _isSpeaking = false;
  String _preferredLanguage = 'en';

  @override
  void initState() {
    super.initState();
    _loadInitData();
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

  Future<void> _loadInitData() async {
    try {
      final user = await ApiService.getCachedUser();
      if (user != null) {
        _preferredLanguage = user['preferred_language'] ?? 'en';
      }

      final res = await ApiService.listPlots();
      setState(() {
        _plots = res['plots'] ?? [];
        if (_plots.isNotEmpty) {
          _selectedPlotId = _plots[0]['id'];
        }
        _isLoadingPlots = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingPlots = false;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        maxWidth: 1080,
        maxHeight: 1080,
      );
      if (picked != null) {
        setState(() {
          _imageFile = File(picked.path);
          _result = null;
          _errorMessage = '';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to select image.';
      });
    }
  }

  Future<void> _startScan() async {
    if (_imageFile == null) {
      setState(() => _errorMessage = 'Please take or select a leaf photo first');
      return;
    }
    if (_selectedPlotId == null) {
      setState(() => _errorMessage = 'Please register and select a plot first');
      return;
    }

    setState(() {
      _isAnalyzing = true;
      _errorMessage = '';
      _result = null;
      _logs = ['Uploading leaf signature...'];
    });

    // Simulate log steps
    _addLogWithDelay('Running leaf stress detection...', 1000);
    _addLogWithDelay('Evaluating cellular stress patterns...', 2000);
    _addLogWithDelay('Consulting AgriSense AI crop model...', 3000);

    try {
      final res = await ApiService.analyzeCropHealth(_imageFile!.path, _selectedPlotId!);
      
      // Wait for celery / check completed status
      if (res['status'] == 'pending' || res['status'] == 'processing') {
        int attempts = 0;
        while (attempts < 10) {
          await Future.delayed(const Duration(milliseconds: 1500));
          attempts++;
          final check = await ApiService.getHealthRecord(res['id']);
          if (check['status'] == 'completed') {
            setState(() {
              _result = check;
              _isAnalyzing = false;
              _imageFile = null;
            });
            return;
          } else if (check['status'] == 'failed') {
            throw Exception('Analysis failed on server.');
          }
        }
        throw Exception('Analysis timed out.');
      } else {
        setState(() {
          _result = res;
          _isAnalyzing = false;
          _imageFile = null;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'AI Diagnostics failed. Please try again.';
        _isAnalyzing = false;
      });
    }
  }

  void _addLogWithDelay(String msg, int ms) {
    Future.delayed(Duration(milliseconds: ms), () {
      if (mounted && _isAnalyzing) {
        setState(() {
          _logs.add(msg);
        });
      }
    });
  }

  Future<void> _toggleSpeakReport() async {
    if (_isSpeaking) {
      await _tts.stop();
      setState(() => _isSpeaking = false);
      return;
    }

    if (_result == null) return;

    final isHindi = _preferredLanguage == 'hi';
    String text = '';

    if (isHindi) {
      text = 'जांच रिपोर्ट पूरी हो गई है. फसल रोग निदान है: ${_result!['diagnosis'] ?? 'स्वस्थ पत्तियां'}. ';
      if (_result!['recommendation_text'] != null) {
        text += 'एआई उपचार सलाह है: ${_result!['recommendation_text']}. ';
      }
    } else {
      text = 'Diagnostic scan complete. The diagnosis is: ${_result!['diagnosis'] ?? 'Healthy leaves'}. ';
      if (_result!['recommendation_text'] != null) {
        text += 'AI Recommendation: ${_result!['recommendation_text']}. ';
      }
    }

    await _tts.setLanguage(isHindi ? 'hi-IN' : 'en-US');
    await _tts.setSpeechRate(0.45);
    await _tts.speak(text);
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingPlots) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF10B981)),
      );
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'AI Crop Clinic',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          const Text(
            'Scan leaves for immediate treatment advice',
            style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 20),

          if (_errorMessage.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.08),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '⚠️ $_errorMessage',
                style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Plot dropdown selector
          const Text(
            'SELECT FIELD PLOT',
            style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF09090B),
              border: Border.all(color: const Color(0xFF18181B)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedPlotId,
                dropdownColor: const Color(0xFF09090B),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                isExpanded: true,
                hint: const Text('Select a plot', style: TextStyle(color: Color(0xFF52525B))),
                items: _plots.map<DropdownMenuItem<String>>((plot) {
                  return DropdownMenuItem<String>(
                    value: plot['id'],
                    child: Text(plot['plot_name'] ?? 'Field'),
                  );
                }).toList(),
                onChanged: _isAnalyzing
                    ? null
                    : (val) {
                        setState(() => _selectedPlotId = val);
                      },
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Camera frame container
          GestureDetector(
            onTap: _isAnalyzing
                ? null
                : () {
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: const Color(0xFF09090B),
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                      ),
                      builder: (context) => SafeArea(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ListTile(
                              leading: const Icon(Icons.camera_alt, color: Color(0xFF10B981)),
                              title: const Text('Use Camera', style: TextStyle(color: Colors.white)),
                              onTap: () {
                                Navigator.pop(context);
                                _pickImage(ImageSource.camera);
                              },
                            ),
                            ListTile(
                              leading: const Icon(Icons.photo_library, color: Color(0xFF10B981)),
                              title: const Text('Select from Gallery', style: TextStyle(color: Colors.white)),
                              onTap: () {
                                Navigator.pop(context);
                                _pickImage(ImageSource.gallery);
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
            child: Container(
              height: 220,
              decoration: BoxDecoration(
                color: const Color(0xFF09090B),
                border: Border.all(
                  color: _isAnalyzing ? const Color(0xFF10B981) : const Color(0xFF18181B),
                  style: BorderStyle.solid,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: _isAnalyzing
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(color: Color(0xFF10B981)),
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24.0),
                            child: Column(
                              children: _logs.map((log) {
                                return Text(
                                  '✓ $log',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF34D399),
                                    fontSize: 10,
                                    fontFamily: 'monospace',
                                  ),
                                );
                              }).toList(),
                            ),
                          )
                        ],
                      ),
                    )
                  : _imageFile != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(15),
                          child: Image.file(
                            _imageFile!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                          ),
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt, color: Color(0xFF52525B), size: 40),
                            SizedBox(height: 8),
                            Text(
                              'Snap or Select Leaf Photo',
                              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Take a close-up photo of leaf damage',
                              style: TextStyle(color: Color(0xFF52525B), fontSize: 9),
                            ),
                          ],
                        ),
            ),
          ),
          const SizedBox(height: 20),

          // Start diagnostics button
          if (_imageFile != null && !_isAnalyzing) ...[
            ElevatedButton(
              onPressed: _startScan,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: const Color(0xFF030303),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Text('🧬 Start Diagnostics Scan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
            const SizedBox(height: 20),
          ],

          // Analysis Output Card
          if (_result != null) ...[
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'DIAGNOSIS OUTPUT',
                            style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _result!['diagnosis'] ?? 'Healthy Leaves',
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'SEVERITY',
                            style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            (_result!['severity'] ?? 'none').toString().toUpperCase(),
                            style: TextStyle(
                              color: _result!['severity'] == 'severe' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // TTS Voice toggle
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Play Diagnosis Out Loud:',
                          style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          onPressed: _toggleSpeakReport,
                          style: IconButton.styleFrom(
                            backgroundColor: const Color(0xFFFFB1EE),
                            foregroundColor: const Color(0xFF030303),
                            padding: const EdgeInsets.all(8),
                          ),
                          icon: Icon(_isSpeaking ? Icons.square : Icons.play_arrow, size: 18),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (_result!['recommendation_text'] != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.05),
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.15)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 14),
                              SizedBox(width: 6),
                              Text(
                                'Recommended Action Protocol:',
                                style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                              )
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _result!['recommendation_text'],
                            style: const TextStyle(color: Color(0xFFE4E4E7), fontSize: 12, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
