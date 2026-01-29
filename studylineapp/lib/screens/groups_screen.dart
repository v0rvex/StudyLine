// lib/screens/groups_screen.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api.dart';
import '../app_state.dart';
import '../widgets/custom_appbar.dart';
import 'schedule_screen.dart';
import 'settings_screen.dart';
import 'teacher_schedule_screen.dart';
import 'package:flutter_svg_provider/flutter_svg_provider.dart';

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});
  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _groups = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _firstLoad = true;
  bool _isRefreshing = false;
  Timer? _poller;
  String _query = '';
  final TextEditingController _searchCtl = TextEditingController();
  late final AnimationController _listAnim;

  @override
  void initState() {
    super.initState();
    _listAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 350));
    _load(initial: true);
    _poller = Timer.periodic(const Duration(seconds: 60), (_) => _load(initial: false));
    _searchCtl.addListener(() {
      setState(() {
        _query = _searchCtl.text;
        _applyFilter();
      });
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _openPinned());
  }

  void _applyFilter() {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) {
      _filtered = List.from(_groups);
    } else {
      _filtered = _groups.where((g) {
        final name = (g['name'] as String?) ?? '';
        return name.toLowerCase().contains(q);
      }).toList();
    }
  }

  Future<void> _openPinned() async {
    final app = Provider.of<AppState>(context, listen: false);
    final pinned = app.pinnedGroupId;
    if (pinned != null) {
      await Future.delayed(const Duration(milliseconds: 300));
      final found = _groups.firstWhere((g) => (g['id'] as num).toInt() == pinned, orElse: () => {});
      final name = (found is Map && (found['name'] as String?)?.isNotEmpty == true) ? found['name'] as String : '';
      Navigator.of(context).push(_fadeRoute(ScheduleScreen(groupId: pinned, groupName: name)));
    }
  }

  Future<void> _load({required bool initial}) async {
    if (initial) setState(() { _firstLoad = true; });
    else setState(() { _isRefreshing = true; });
    try {
      final newData = await Api.getGroups();

      final newGroupsJson = jsonEncode(newData);
      final currentGroupsJson = jsonEncode(_groups);

      if (newGroupsJson == currentGroupsJson && mounted && !initial) {
        if (_isRefreshing) setState(() { _isRefreshing = false; });
        return;
      }

      if (mounted) {
        setState(() {
          _groups = newData;
          _applyFilter();
        });
        _listAnim.forward(from: 0);
      }
    } catch (e) {
      debugPrint('getGroups error: $e');
    } finally {
      if (mounted) setState(() { _firstLoad = false; _isRefreshing = false; });
    }
  }

  Route _fadeRoute(Widget page) {
    return PageRouteBuilder(
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, anim, __, child) {
        final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
        return FadeTransition(opacity: curved, child: SlideTransition(position: Tween(begin: const Offset(0, 0.03), end: Offset.zero).animate(curved), child: child));
      },
      transitionDuration: const Duration(milliseconds: 320),
    );
  }

  @override
  void dispose() {
    _poller?.cancel();
    _searchCtl.dispose();
    _listAnim.dispose();
    super.dispose();
  }

  Widget _groupCard(Map<String, dynamic> g, Color fg, AppState app) {
    final id = (g['id'] as num).toInt();
    final name = (g['name'] as String?)?.trim() ?? '';
    final shift = (g['shift'] as num?)?.toInt() ?? 1;
    final displayName = name.isNotEmpty ? name : '';

    final isPinned = app.pinnedGroupId == id;
    final canPin = !app.isLogged;

    void togglePin() {
      if (canPin) {
        app.savePinnedGroup(isPinned ? null : id);
      }
    }

    return SizeTransition(
      sizeFactor: CurvedAnimation(parent: _listAnim, curve: Curves.easeOut),
      axisAlignment: 0.0,
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () async {
            await app.subscribeGroup(id);
            Navigator.of(context).push(_fadeRoute(ScheduleScreen(groupId: id, groupName: displayName)));
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
            child: Row(children: [

              Expanded(child: Text(
                  displayName,
                  style: TextStyle(color: fg, fontSize: 16, fontWeight: isPinned ? FontWeight.w800 : FontWeight.w700))),

              // Кнопка Закрепить/Открепить в стиле контейнера
              if (canPin) ...[
                const SizedBox(width: 8),
                InkWell(
                  onTap: togglePin,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Colors.black12,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                      color: isPinned ? Theme.of(context).colorScheme.primary : fg.withOpacity(0.5),
                    ),
                  ),
                ),
              ],

              const SizedBox(width: 8),

              // Иконка смены
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Colors.black12,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(shift == 2 ? Icons.wb_sunny : Icons.wb_twighlight, color: fg),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppState>(context);
    final fg = Theme.of(context).colorScheme.onBackground;
    return Scaffold(
      appBar: ModernAppBar(
        title: '',
        actions: [
          // УДАЛЕНА КНОПКА ПРЕПОДАВАТЕЛЯ ИЗ APPBAR
          IconButton(icon: const Icon(Icons.search), onPressed: () {
            showSearch(context: context, delegate: _GroupSearchDelegate(_groups));
          })
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
              child: Row(children: [
                Container(width: 44, height: 44, decoration: BoxDecoration(image: DecorationImage(image: Svg('lib/assets/logo.svg'), fit: BoxFit.scaleDown), color: Colors.white, borderRadius: BorderRadius.circular(10))),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('StudyLine', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: fg)),
                  const SizedBox(height: 4),
                  Text('Онлайн-расписание', style: TextStyle(fontSize: 12, color: fg.withOpacity(0.7))),
                ])
              ]),
            ),
            const Divider(),

            // Вход/Выход преподавателя
            ListTile(
              leading: const Icon(Icons.person),
              title: Text(app.isLogged ? 'Выйти из аккаунта' : 'Войти как преподаватель'),
              onTap: () async {
                Navigator.pop(context);
                if (app.isLogged) {
                  await app.logoutTeacher();
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Вы вышли')));
                } else {
                  final res = await showDialog<Map<String,String>>(context: context, builder: (_) {
                    final login = TextEditingController();
                    final pass = TextEditingController();
                    return Dialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Text('Вход учителя', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          TextField(controller: login, decoration: const InputDecoration(labelText: 'Логин')),
                          const SizedBox(height: 8),
                          TextField(controller: pass, decoration: const InputDecoration(labelText: 'Пароль'), obscureText: true),
                          const SizedBox(height: 14),
                          Row(children: [
                            Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена'))),
                            const SizedBox(width: 8),
                            Expanded(child: ElevatedButton(onPressed: () => Navigator.pop(context, {'login': login.text.trim(), 'password': pass.text}), child: const Text('Войти'))),
                          ])
                        ]),
                      ),
                    );
                  });
                  if (res != null) {
                    try {
                      await app.loginTeacher(res['login']!, res['password']!);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Вход успешен')));
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ошибка входа: $e')));
                    }
                  }
                }
              },
            ),

            // Открепить группу
            if (app.hasPinnedGroup) ListTile(
              leading: const Icon(Icons.link_off),
              title: const Text('Выйти из группы'),
              onTap: () async {
                final id = app.pinnedGroupId;
                if (id != null) {
                  await app.savePinnedGroup(null);
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Группа отвязана')));
                }
                Navigator.pop(context);
              },
            ),
            const Spacer(),

            // Настройки
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Настройки'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(_fadeRoute(const SettingsScreen()));
              },
            ),
            const SizedBox(height: 12),
          ]),
        ),
      ),
      body: Stack(children: [
        if (_firstLoad) const Center(child: CircularProgressIndicator()),
        if (!_firstLoad)
          RefreshIndicator(
            onRefresh: () => _load(initial: true),
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 20),
              itemCount: _filtered.length,
              itemBuilder: (_, i) => _groupCard(_filtered[i], fg, app),
            ),
          ),
        if (_isRefreshing) Positioned(top: 0, left: 0, right: 0, child: LinearProgressIndicator(color: Theme.of(context).colorScheme.primary, minHeight: 3)),
      ]),

      // <-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Кнопка преподавателя в правом нижнем углу -->
      floatingActionButton: (app.isLogged && app.teacherId != null)
          ? FloatingActionButton(
        onPressed: () {
          final tid = app.teacherId;
          if (tid != null) {
            Navigator.of(context).push(_fadeRoute(TeacherScheduleScreen(teacherId: tid)));
          }
        },
        tooltip: 'Моё расписание (учитель)',
        child: const Icon(Icons.person_pin),
      )
          : null,
      // <-- Конец FAB -->
    );
  }
}

// ... (SearchDelegate остается без изменений) ...

class _GroupSearchDelegate extends SearchDelegate {
  final List<Map<String,dynamic>> groups;
  _GroupSearchDelegate(this.groups);

  @override
  String get searchFieldLabel => 'Поиск группы';

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [if (query.isNotEmpty) IconButton(icon: const Icon(Icons.clear), onPressed: () => query = '')];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return const BackButton();
  }

  @override
  Widget buildResults(BuildContext context) {
    final q = query.toLowerCase();
    final found = groups.where((g) => ((g['name'] as String?) ?? '').toLowerCase().contains(q)).toList();
    return ListView.builder(itemCount: found.length, itemBuilder: (_, i) {
      final g = found[i];
      final name = (g['name'] as String?) ?? '';
      return ListTile(title: Text(name));
    });
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    final q = query.toLowerCase();
    final sugg = q.isEmpty ? groups.take(10).toList() : groups.where((g) => ((g['name'] as String?) ?? '').toLowerCase().contains(q)).toList();
    return ListView.builder(itemCount: sugg.length, itemBuilder: (_, i) {
      final g = sugg[i];
      final name = (g['name'] as String?) ?? '';
      return ListTile(title: Text(name), onTap: () {
        close(context, null);

        final id = (g['id'] as num).toInt();
        final app = Provider.of<AppState>(context, listen: false);
        app.subscribeGroup(id);

        if (!app.isLogged) app.savePinnedGroup(id);

        Navigator.of(context).push(MaterialPageRoute(builder: (_) => ScheduleScreen(groupId: id, groupName: name)));
      });
    });
  }
}