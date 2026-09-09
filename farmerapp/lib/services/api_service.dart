import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';

class ApiService {
  static String _baseUrl = 'http://127.0.0.1:8000/api/v1';
  static String get baseUrl => _baseUrl;

  static Future<void> loadBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString('api_base_url') ?? 'http://127.0.0.1:8000/api/v1';
  }

  static Future<void> setCustomBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
    _baseUrl = url;
  }

  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<void> saveTokens(String access, String refresh, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', access);
    await prefs.setString('refresh_token', refresh);
    await prefs.setString('user_profile', jsonEncode(user));
  }

  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_profile');
  }

  static Future<Map<String, dynamic>?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user_profile');
    if (userStr == null) return null;
    return jsonDecode(userStr);
  }

  // Auth Headers helper
  static Future<Map<String, String>> _getHeaders({bool isMultipart = false}) async {
    final token = await getAccessToken();
    return {
      if (!isMultipart) 'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // --- API Methods ---

  // Login
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      await saveTokens(data['access_token'], data['refresh_token'], data['user']);
      return {'success': true, 'data': data};
    } else {
      return {'success': false, 'message': data['detail'] ?? 'Login failed'};
    }
  }

  // Stats
  static Future<Map<String, dynamic>> getDashboardStats() async {
    final url = Uri.parse('$baseUrl/dashboard/stats');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // Weather forecast
  static Future<Map<String, dynamic>> getWeatherForecast(double lat, double lon) async {
    final url = Uri.parse('$baseUrl/weather/forecast?latitude=$lat&longitude=$lon');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // List plots
  static Future<Map<String, dynamic>> listPlots() async {
    final url = Uri.parse('$baseUrl/plots/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // Create plot
  static Future<Map<String, dynamic>> createPlot({
    required String name,
    required double lat,
    required double lng,
    required double acres,
    required String soilType,
    required String geojson,
  }) async {
    final url = Uri.parse('$baseUrl/plots/');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'plot_name': name,
        'latitude': lat,
        'longitude': lng,
        'approximate_area_acres': acres,
        'soil_type': soilType,
        'coordinates_geojson': geojson,
      }),
    );
    return jsonDecode(response.body);
  }

  // Delete plot
  static Future<bool> deletePlot(String id) async {
    final url = Uri.parse('$baseUrl/plots/$id');
    final headers = await _getHeaders();
    final response = await http.delete(url, headers: headers);
    return response.statusCode == 200 || response.statusCode == 204;
  }

  // List Crops
  static Future<Map<String, dynamic>> listCrops() async {
    final url = Uri.parse('$baseUrl/crops/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // Crop disease scanner (Multipart)
  static Future<Map<String, dynamic>> analyzeCropHealth(String filePath, String plotId) async {
    final url = Uri.parse('$baseUrl/health/analyze');
    final headers = await _getHeaders(isMultipart: true);
    
    final request = http.MultipartRequest('POST', url)
      ..headers.addAll(headers)
      ..fields['plot_id'] = plotId
      ..files.add(await http.MultipartFile.fromPath(
        'file',
        filePath,
        contentType: MediaType('image', 'jpeg'),
      ));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return jsonDecode(response.body);
  }

  // Get specific health record status
  static Future<Map<String, dynamic>> getHealthRecord(String id) async {
    final url = Uri.parse('$baseUrl/health/$id');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // OCR scanning for input records packet
  static Future<Map<String, dynamic>> uploadInputOCR(String filePath) async {
    final url = Uri.parse('$baseUrl/inputs/ocr');
    final headers = await _getHeaders(isMultipart: true);

    final request = http.MultipartRequest('POST', url)
      ..headers.addAll(headers)
      ..files.add(await http.MultipartFile.fromPath(
        'file',
        filePath,
        contentType: MediaType('image', 'jpeg'),
      ));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return jsonDecode(response.body);
  }

  // List inputs logged
  static Future<Map<String, dynamic>> listInputs() async {
    final url = Uri.parse('$baseUrl/inputs/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // Log new inputs application
  static Future<Map<String, dynamic>> createInput({
    required String cropId,
    required String type,
    required String productName,
    String? brand,
    required double quantity,
    required String unit,
    String? notes,
  }) async {
    final url = Uri.parse('$baseUrl/inputs/');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'crop_id': cropId,
        'input_type': type,
        'product_name': productName,
        'brand': ?brand,
        'quantity': quantity,
        'quantity_unit': unit,
        'application_notes': ?notes,
      }),
    );
    return jsonDecode(response.body);
  }

  // List expenses logged
  static Future<Map<String, dynamic>> listExpenses() async {
    final url = Uri.parse('$baseUrl/expenses/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return jsonDecode(response.body);
  }

  // Log new expense
  static Future<Map<String, dynamic>> createExpense({
    required String cropId,
    required String type,
    required double amount,
    String? notes,
  }) async {
    final url = Uri.parse('$baseUrl/expenses/');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'crop_id': cropId,
        'expense_type': type,
        'amount': amount,
        'notes': ?notes,
      }),
    );
    return jsonDecode(response.body);
  }

  // Join a cooperative group
  static Future<Map<String, dynamic>> joinGroup(String groupId) async {
    final url = Uri.parse('$baseUrl/groups/$groupId/join');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
    );
    return jsonDecode(response.body);
  }

  // List groups current user belongs to
  static Future<List<dynamic>> listMyGroups() async {
    final url = Uri.parse('$baseUrl/groups/my-groups');
    final headers = await _getHeaders();
    final response = await http.get(
      url,
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    } else {
      throw Exception('Failed to load my groups');
    }
  }
}
