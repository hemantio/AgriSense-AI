import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:farmerapp/services/api_service.dart';

class LogsScreen extends StatefulWidget {
  const LogsScreen({super.key});

  @override
  State<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends State<LogsScreen> {
  List<dynamic> _crops = [];
  List<dynamic> _inputs = [];
  List<dynamic> _expenses = [];

  bool _isLoading = true;
  String _activeTab = 'inputs'; // 'inputs' or 'expenses'
  
  String? _selectedCropId;
  bool _isSubmitting = false;

  // Input log form states
  String _inputType = 'Fertilizer';
  final _productController = TextEditingController();
  final _brandController = TextEditingController();
  final _qtyController = TextEditingController();
  String _selectedUnit = 'kg';
  final _notesController = TextEditingController();
  
  // OCR state
  bool _isOcrAnalyzing = false;
  final ImagePicker _picker = ImagePicker();

  // Expense log form states
  String _expenseType = 'Seeds';
  final _amountController = TextEditingController();
  final _expenseNotesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadLogsData();
  }

  Future<void> _loadLogsData() async {
    setState(() => _isLoading = true);
    try {
      // 1. Get crops
      final cropsResp = await ApiService.listCrops();
      _crops = cropsResp['crops'] ?? [];
      if (_crops.isNotEmpty) {
        _selectedCropId = _crops[0]['id'];
      }

      // 2. Get inputs logs
      final inputsResp = await ApiService.listInputs();
      _inputs = inputsResp['inputs'] ?? [];

      // 3. Get expenses logs
      final expensesResp = await ApiService.listExpenses();
      _expenses = expensesResp['expenses'] ?? [];
    } catch (e) {
      print(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _scanPacketOcr() async {
    try {
      final XFile? picked = await _picker.pickImage(source: ImageSource.camera);
      if (picked == null) return;

      setState(() {
        _isOcrAnalyzing = true;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Processing packet label OCR...')),
      );

      final data = await ApiService.uploadInputOCR(picked.path);
      
      setState(() {
        if (data['product_name'] != null) _productController.text = data['product_name'];
        if (data['brand'] != null) _brandController.text = data['brand'];
        if (data['quantity'] != null) _qtyController.text = data['quantity'].toString();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OCR packet scan complete!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OCR Scan failed. Enter details manually.')),
      );
    } finally {
      setState(() => _isOcrAnalyzing = false);
    }
  }

  Future<void> _handleLogInputSubmit() async {
    final name = _productController.text.trim();
    final qty = double.tryParse(_qtyController.text.trim());

    if (_selectedCropId == null) {
      _showToast('Please select a target crop');
      return;
    }
    if (name.isEmpty) {
      _showToast('Please enter product name');
      return;
    }
    if (qty == null) {
      _showToast('Please enter valid quantity');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await ApiService.createInput(
        cropId: _selectedCropId!,
        type: _inputType,
        productName: name,
        brand: _brandController.text.trim().isEmpty ? null : _brandController.text.trim(),
        quantity: qty,
        unit: _selectedUnit,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Input spray logged successfully!')),
      );

      _productController.clear();
      _brandController.clear();
      _qtyController.clear();
      _notesController.clear();

      final res = await ApiService.listInputs();
      setState(() {
        _inputs = res['inputs'] ?? [];
      });
    } catch (e) {
      _showToast('Failed to save input spray');
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleLogExpenseSubmit() async {
    final amount = double.tryParse(_amountController.text.trim());

    if (_selectedCropId == null) {
      _showToast('Please select a target crop');
      return;
    }
    if (amount == null) {
      _showToast('Please enter valid cost amount');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await ApiService.createExpense(
        cropId: _selectedCropId!,
        type: _expenseType,
        amount: amount,
        notes: _expenseNotesController.text.trim().isEmpty ? null : _expenseNotesController.text.trim(),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Expense logged successfully!')),
      );

      _amountController.clear();
      _expenseNotesController.clear();

      final res = await ApiService.listExpenses();
      setState(() {
        _expenses = res['expenses'] ?? [];
      });
    } catch (e) {
      _showToast('Failed to save expense');
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  String _getCropLabel(String cropId) {
    final match = _crops.firstWhere((c) => c['id'] == cropId, orElse: () => null);
    if (match != null) {
      return '${match['crop_type']} (${match['variety']})';
    }
    return 'Active Crop';
  }

  @override
  void dispose() {
    _productController.dispose();
    _brandController.dispose();
    _qtyController.dispose();
    _notesController.dispose();
    _amountController.dispose();
    _expenseNotesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));
    }

    if (_crops.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            '⚠️ Please register active crops in the main panel to log activities.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF52525B), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Log Activities',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          const Text(
            'Record fertilizer sprays and crop expenses',
            style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 20),

          // Custom tab selector
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _activeTab = 'inputs'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: _activeTab == 'inputs' ? const Color(0xFF09090B) : Colors.transparent,
                      border: Border.all(
                        color: _activeTab == 'inputs' ? const Color(0xFF18181B) : Colors.transparent,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.list_alt, size: 14, color: _activeTab == 'inputs' ? const Color(0xFF10B981) : const Color(0xFF52525B)),
                        const SizedBox(width: 6),
                        Text(
                          'Inputs Spray',
                          style: TextStyle(
                            color: _activeTab == 'inputs' ? const Color(0xFF10B981) : const Color(0xFF52525B),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _activeTab = 'expenses'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: _activeTab == 'expenses' ? const Color(0xFF09090B) : Colors.transparent,
                      border: Border.all(
                        color: _activeTab == 'expenses' ? const Color(0xFF18181B) : Colors.transparent,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.attach_money, size: 14, color: _activeTab == 'expenses' ? const Color(0xFF10B981) : const Color(0xFF52525B)),
                        const SizedBox(width: 6),
                        Text(
                          'Expenses',
                          style: TextStyle(
                            color: _activeTab == 'expenses' ? const Color(0xFF10B981) : const Color(0xFF52525B),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // TAB Content
          if (_activeTab == 'inputs') ...[
            // Input log Form
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
                        'LOG SPRAY RECORD',
                        style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                      ),
                      ElevatedButton.icon(
                        onPressed: _isOcrAnalyzing ? null : _scanPacketOcr,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFB1EE),
                          foregroundColor: const Color(0xFF030303),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          minimumSize: Size.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          elevation: 0,
                        ),
                        icon: _isOcrAnalyzing 
                          ? const SizedBox(width: 10, height: 10, child: CircularProgressIndicator(color: Color(0xFF030303), strokeWidth: 1))
                          : const Icon(Icons.qr_code_scanner, size: 12),
                        label: Text(_isOcrAnalyzing ? 'Reading...' : 'OCR Scan Label', style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                      )
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Target Crop dropdown
                  const Text('TARGET CROP', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(color: const Color(0xFF030303), border: Border.all(color: const Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedCropId,
                        dropdownColor: const Color(0xFF09090B),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        isExpanded: true,
                        items: _crops.map((c) {
                          return DropdownMenuItem<String>(
                            value: c['id'],
                            child: Text('${c['crop_type']} (${c['variety']})'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedCropId = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Spray Type Selector
                  const Text('INPUT TYPE', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Row(
                    children: ['Fertilizer', 'Pesticide'].map((type) {
                      final isSel = _inputType == type;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _inputType = type),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFF10B981).withOpacity(0.08) : const Color(0xFF030303),
                              border: Border.all(color: isSel ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFF18181B)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(type, style: TextStyle(color: isSel ? const Color(0xFF34D399) : const Color(0xFF52525B), fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // Product Name
                  const Text('PRODUCT NAME', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _productController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. Urea or Neem Oil',
                      hintStyle: const TextStyle(color: Color(0xFF52525B)),
                      filled: true,
                      fillColor: const Color(0xFF030303),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF10B981)), borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Qty & Unit
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('QUANTITY', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _qtyController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: 'e.g. 5',
                                hintStyle: const TextStyle(color: Color(0xFF52525B)),
                                filled: true,
                                fillColor: const Color(0xFF030303),
                                enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                                focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF10B981)), borderRadius: BorderRadius.circular(8)),
                                contentPadding: const EdgeInsets.all(12),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('UNIT', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(color: const Color(0xFF030303), border: Border.all(color: const Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedUnit,
                                  dropdownColor: const Color(0xFF09090B),
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  isExpanded: true,
                                  items: ['kg', 'liters', 'packets'].map((u) {
                                    return DropdownMenuItem(value: u, child: Text(u));
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedUnit = val);
                                  },
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleLogInputSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: const Color(0xFF030303),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    child: _isSubmitting 
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Color(0xFF030303), strokeWidth: 1.5))
                      : const Text('Save Spray Log', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Spray history list
            const Text(
              'RECENT APPLICATION LOGS',
              style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            if (_inputs.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(16.0), child: Text('No sprays logged yet.', style: TextStyle(color: Color(0xFF52525B), fontSize: 11, fontFamily: 'monospace'))))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _inputs.length,
                itemBuilder: (context, index) {
                  final item = _inputs[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: const Color(0xFF09090B), border: Border.all(color: const Color(0xFF18181B)), borderRadius: BorderRadius.circular(16)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                              decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.08), borderRadius: BorderRadius.circular(4)),
                              child: Text(
                                (item['input_type'] ?? 'Spray').toString().toUpperCase(),
                                style: const TextStyle(color: Color(0xFF34D399), fontSize: 8, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(item['product_name'] ?? 'Spray', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Crop: ${_getCropLabel(item['crop_id'])}', style: const TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace')),
                          ],
                        ),
                        Text('${item['quantity']} ${item['quantity_unit']}', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                      ],
                    ),
                  );
                },
              ),
          ] else ...[
            // TAB 2: EXPENSES FORM
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
                  const Text(
                    'LOG EXPENSE RECORD',
                    style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // Crop
                  const Text('TARGET CROP', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(color: const Color(0xFF030303), border: Border.all(color: const Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedCropId,
                        dropdownColor: const Color(0xFF09090B),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        isExpanded: true,
                        items: _crops.map((c) {
                          return DropdownMenuItem<String>(
                            value: c['id'],
                            child: Text('${c['crop_type']} (${c['variety']})'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedCropId = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Category
                  const Text('CATEGORY', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(color: const Color(0xFF030303), border: Border.all(color: const Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _expenseType,
                        dropdownColor: const Color(0xFF09090B),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        isExpanded: true,
                        items: ['Seeds', 'Fertilizer', 'Labor', 'Tractor', 'Irrigation'].map((t) {
                          return DropdownMenuItem(value: t, child: Text(t));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _expenseType = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Cost
                  const Text('COST AMOUNT (₹)', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. 1500',
                      hintStyle: const TextStyle(color: Color(0xFF52525B)),
                      filled: true,
                      fillColor: const Color(0xFF030303),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF10B981)), borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Notes
                  const Text('EXPENSE DETAILS', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _expenseNotesController,
                    maxLines: 2,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. Bought urea bags',
                      hintStyle: const TextStyle(color: Color(0xFF52525B)),
                      filled: true,
                      fillColor: const Color(0xFF030303),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF10B981)), borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleLogExpenseSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: const Color(0xFF030303),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    child: _isSubmitting 
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Color(0xFF030303), strokeWidth: 1.5))
                      : const Text('Save Expense', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Cost ledger list
            const Text(
              'RECENT COST LEDGER',
              style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            if (_expenses.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(16.0), child: Text('No expenses logged yet.', style: TextStyle(color: Color(0xFF52525B), fontSize: 11, fontFamily: 'monospace'))))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _expenses.length,
                itemBuilder: (context, index) {
                  final item = _expenses[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: const Color(0xFF09090B), border: Border.all(color: const Color(0xFF18181B)), borderRadius: BorderRadius.circular(16)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                              decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.08), borderRadius: BorderRadius.circular(4)),
                              child: Text(
                                (item['expense_type'] ?? 'Cost').toString().toUpperCase(),
                                style: const TextStyle(color: Color(0xFFF4A261), fontSize: 8, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                              ),
                            ),
                            const SizedBox(height: 8),
                            if (item['notes'] != null) Text(item['notes'], style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Crop: ${_getCropLabel(item['crop_id'])}', style: const TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace')),
                          ],
                        ),
                        Text('- ₹${item['amount'].toString()}', style: const TextStyle(color: Color(0xFF34D399), fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                      ],
                    ),
                  );
                },
              ),
          ]
        ],
      ),
    );
  }
}
