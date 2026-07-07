import 'package:flutter/material.dart';
import 'package:farmerapp/services/api_service.dart';

class PlotsScreen extends StatefulWidget {
  const PlotsScreen({super.key});

  @override
  State<PlotsScreen> createState() => _PlotsScreenState();
}

class _PlotsScreenState extends State<PlotsScreen> {
  List<dynamic> _plots = [];
  bool _isLoading = true;
  bool _isDrawing = false;
  
  // Form states
  final _nameController = TextEditingController();
  final _acresController = TextEditingController();
  String _selectedSoil = 'Clay';
  bool _isSubmitting = false;
  String _formError = '';

  @override
  void initState() {
    super.initState();
    _fetchPlots();
  }

  Future<void> _fetchPlots() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.listPlots();
      setState(() {
        _plots = res['plots'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSubmitPlot() async {
    final name = _nameController.text.trim();
    final acres = double.tryParse(_acresController.text.trim()) ?? 1.0;

    if (name.isEmpty) {
      setState(() => _formError = 'Please enter a field name');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _formError = '';
    });

    try {
      // Mock coordinates (Sonipat center) and basic GeoJSON
      const lat = 28.9812;
      const lng = 77.0123;
      const geojson = '{"type":"Polygon","coordinates":[[[77.012,28.981],[77.013,28.981],[77.013,28.982],[77.012,28.982],[77.012,28.981]]]}';

      await ApiService.createPlot(
        name: name,
        lat: lat,
        lng: lng,
        acres: acres,
        soilType: _selectedSoil,
        geojson: geojson,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Field plot registered successfully!')),
      );

      _nameController.clear();
      _acresController.clear();
      setState(() {
        _isDrawing = false;
      });
      _fetchPlots();
    } catch (e) {
      setState(() => _formError = 'Failed to register plot. Try again.');
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleDeletePlot(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF09090B),
        title: const Text('Delete Field?', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to delete this farm plot?', style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 13)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: Color(0xFF52525B)))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Color(0xFFEF4444)))),
        ],
      ),
    );

    if (confirm == true) {
      final ok = await ApiService.deletePlot(id);
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Field plot deleted.')),
        );
        _fetchPlots();
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _acresController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Registered Fields',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          const Text(
            'View and outline boundaries on maps',
            style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 20),

          // Map mock container
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: const Color(0xFF09090B),
              border: Border.all(color: const Color(0xFF18181B)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.map, color: const Color(0xFF10B981).withOpacity(0.4), size: 36),
                      const SizedBox(height: 8),
                      const Text(
                        'AgriSense Satellite Maps Active',
                        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Center: Sonipat Region, India',
                        style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ),
                if (_isDrawing)
                  Positioned(
                    top: 10,
                    left: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF030303).withOpacity(0.9),
                        border: Border.all(color: const Color(0xFF18181B)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        '📍 Boundary marking mocked: Centered coordinates resolved automatically.',
                        style: TextStyle(color: Color(0xFF34D399), fontSize: 9, fontFamily: 'monospace'),
                      ),
                    ),
                  )
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Drawing controller button
          if (!_isDrawing)
            ElevatedButton.icon(
              onPressed: () => setState(() => _isDrawing = true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF18181B),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFF27272A)),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.add, color: Color(0xFF10B981), size: 16),
              label: const Text('Add New Field Plot', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            )
          else ...[
            // Form fields for plot submission
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
                    'NEW FIELD DETAILS',
                    style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  if (_formError.isNotEmpty) ...[
                    Text('⚠️ $_formError', style: const TextStyle(color: Color(0xFFEF4444), fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                  ],

                  // Field Name
                  const Text('FIELD NAME', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _nameController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. North Rice Field',
                      hintStyle: const TextStyle(color: Color(0xFF52525B)),
                      filled: true,
                      fillColor: const Color(0xFF030303),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF18181B)), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: Color(0xFF10B981)), borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      // Acres
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('AREA (ACRES)', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _acresController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: 'e.g. 2.0',
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
                      // Soil
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('SOIL TYPE', style: TextStyle(color: Color(0xFF52525B), fontSize: 9, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFF030303),
                                border: Border.all(color: const Color(0xFF18181B)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedSoil,
                                  dropdownColor: const Color(0xFF09090B),
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  items: ['Clay', 'Silt', 'Sand', 'Loam', 'Peat'].map((s) {
                                    return DropdownMenuItem(value: s, child: Text(s));
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedSoil = val);
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

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setState(() => _isDrawing = false),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF18181B)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Cancel', style: TextStyle(color: Colors.white, fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _handleSubmitPlot,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: const Color(0xFF030303),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: _isSubmitting 
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Color(0xFF030303), strokeWidth: 1.5))
                            : const Text('Save Field', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),

          // Registry list
          const Text(
            'REGISTRY LEDGER',
            style: TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          if (_isLoading)
            const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator(color: Color(0xFF10B981))))
          else if (_plots.isEmpty)
            const Center(child: Padding(padding: EdgeInsets.all(24.0), child: Text('No fields registered yet.', style: TextStyle(color: Color(0xFF52525B), fontSize: 11, fontFamily: 'monospace'))))
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _plots.length,
              itemBuilder: (context, index) {
                final plot = _plots[index];
                final isVerified = plot['verification_status'] == 'verified';
                final isRejected = plot['verification_status'] == 'rejected';

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF09090B),
                    border: Border.all(color: const Color(0xFF18181B)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plot['plot_name'] ?? 'Field Plot',
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Soil: ${plot['soil_type'] ?? 'Loam'} • ${plot['approximate_area_acres'] ?? 1.0} Acres',
                            style: const TextStyle(color: Color(0xFF52525B), fontSize: 10, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          // status chip
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isVerified 
                                ? const Color(0xFF10B981).withOpacity(0.05) 
                                : isRejected 
                                  ? const Color(0xFFEF4444).withOpacity(0.05) 
                                  : const Color(0xFFF59E0B).withOpacity(0.05),
                              border: Border.all(
                                color: isVerified 
                                  ? const Color(0xFF10B981).withOpacity(0.2) 
                                  : isRejected 
                                    ? const Color(0xFFEF4444).withOpacity(0.2) 
                                    : const Color(0xFFF59E0B).withOpacity(0.2),
                              ),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isVerified 
                                    ? Icons.verified_user_outlined 
                                    : isRejected 
                                      ? Icons.gpp_bad_outlined 
                                      : Icons.gpp_maybe_outlined,
                                  color: isVerified 
                                    ? const Color(0xFF10B981) 
                                    : isRejected 
                                      ? const Color(0xFFEF4444) 
                                      : const Color(0xFFF59E0B),
                                  size: 10,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING',
                                  style: TextStyle(
                                    color: isVerified 
                                      ? const Color(0xFF10B981) 
                                      : isRejected 
                                        ? const Color(0xFFEF4444) 
                                        : const Color(0xFFF59E0B),
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () => _handleDeletePlot(plot['id']),
                            icon: const Icon(Icons.delete_outline, color: Color(0xFF52525B), size: 18),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          )
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
