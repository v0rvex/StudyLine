// lib/widgets/custom_appbar.dart
import 'package:flutter/material.dart';

class ModernAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showBackButton;
  final VoidCallback? onBack;

  const ModernAppBar({super.key, required this.title, this.actions, this.showBackButton = false, this.onBack});

  @override
  Widget build(BuildContext context) {
    final Color fg = Theme.of(context).colorScheme.onSurface;
    return AppBar(
      title: Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: fg)),
      backgroundColor: Theme.of(context).colorScheme.surface,
      elevation: 0,
      centerTitle: true,
      actions: actions,
      leading: showBackButton
          ? IconButton(icon: Icon(Icons.arrow_back, color: fg), onPressed: onBack ?? () => Navigator.of(context).pop())
          : null,
      iconTheme: IconThemeData(color: fg),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(56);
}
