// lib/screens/settings_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../widgets/custom_appbar.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppState>(context);
    final fg = Theme.of(context).colorScheme.onBackground;
    return Scaffold(
      appBar: const ModernAppBar(title: 'Настройки', showBackButton: true),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Оформление', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: fg)),
          const SizedBox(height: 12),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              child: Row(children: [
                Expanded(child: Text('Тема', style: TextStyle(fontWeight: FontWeight.w600, color: fg))),
                const SizedBox(width: 8),
                _ThemeSlider(current: app.themeMode, onChange: (m) => app.setThemeMode(m)),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class _ThemeSlider extends StatefulWidget {
  final ThemeMode current;
  final ValueChanged<ThemeMode> onChange;
  const _ThemeSlider({required this.current, required this.onChange});
  @override
  State<_ThemeSlider> createState() => _ThemeSliderState();
}

class _ThemeSliderState extends State<_ThemeSlider> {
  late int idx;
  @override
  void initState() {
    super.initState();
    idx = widget.current == ThemeMode.light ? 1 : (widget.current == ThemeMode.dark ? 2 : 0);
  }

  void _set(int v) {
    setState(() => idx = v);
    widget.onChange(v == 0 ? ThemeMode.system : (v == 1 ? ThemeMode.light : ThemeMode.dark));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: Theme.of(context).cardColor),
      padding: const EdgeInsets.all(6),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        GestureDetector(onTap: () => _set(0), child: _icon(0, Icons.auto_mode)),
        const SizedBox(width: 6),
        GestureDetector(onTap: () => _set(1), child: _icon(1, Icons.wb_sunny)),
        const SizedBox(width: 6),
        GestureDetector(onTap: () => _set(2), child: _icon(2, Icons.nightlight_round)),
      ]),
    );
  }

  Widget _icon(int i, IconData icon) {
    final active = i == idx;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      padding: EdgeInsets.all(active ? 8 : 6), // non-const
      decoration: BoxDecoration(color: active ? Theme.of(context).colorScheme.primary : Colors.transparent, borderRadius: BorderRadius.circular(8)),
      child: Icon(icon, color: active ? Colors.white : Theme.of(context).colorScheme.onSurface),
    );
  }
}
