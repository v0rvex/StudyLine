// lib/screens/schedule_screen.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api.dart';
import '../app_state.dart';
import '../utils.dart';
import '../widgets/custom_appbar.dart';

class ScheduleScreen extends StatefulWidget {
  final int groupId;
  final String groupName;
  const ScheduleScreen({super.key, required this.groupId, required this.groupName});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> with WidgetsBindingObserver, SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> schedule = [];
  Map<int, String> subjects = {};
  Map<int, String> teachers = {};
  List<Map<String, dynamic>> changes = [];
  bool _firstLoad = true;
  bool _isRefreshing = false;
  Timer? poller;
  bool _showNoNetBanner = false;
  bool _hasShownCacheNotice = false;
  late final AnimationController _listAnim;

  // --- ИСПРАВЛЕНИЕ: Хелперы для безопасного JSON-кодирования/декодирования Map с Int-ключами ---
  // Конвертирует Map<int, String> в Map<String, String> для JSON
  Map<String, String> _mapIntKeysToString(Map<int, String> input) {
    return input.map((k, v) => MapEntry(k.toString(), v));
  }

  // Конвертирует Map<String, dynamic> (из JSON) обратно в Map<int, String>
  Map<int, String> _mapStringKeysToInt(Map<String, dynamic> input) {
    final map = <int, String>{};
    input.forEach((key, value) {
      final intKey = int.tryParse(key);
      if (intKey != null && value is String) {
        map[intKey] = value;
      }
    });
    return map;
  }
  // -----------------------------------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _listAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _checkCacheNoticeFlag();
    _loadFromCacheThenNetwork();
    poller = Timer.periodic(const Duration(seconds: 60), (_) => _loadAll());
  }

  Future<void> _checkCacheNoticeFlag() async {
    final app = Provider.of<AppState>(context, listen: false);
    final shown = await app.hasShownCacheNotice(widget.groupId);
    setState(() { _hasShownCacheNotice = shown; });
  }

  Future<void> _loadFromCacheThenNetwork() async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'schedule_cache_${widget.groupId}';
    final cached = prefs.getString(key);
    if (cached != null && cached.isNotEmpty) {
      try {
        final j = jsonDecode(cached) as Map<String, dynamic>;
        setState(() {
          schedule = List<Map<String, dynamic>>.from(j['schedule'] ?? []);
          // ИСПРАВЛЕНО: Декодируем Map с String ключами обратно в Int ключи
          subjects = _mapStringKeysToInt(Map<String, dynamic>.from(j['subjects'] ?? {}));
          teachers = _mapStringKeysToInt(Map<String, dynamic>.from(j['teachers'] ?? {}));
          changes = List<Map<String, dynamic>>.from(j['changes'] ?? []);
          _firstLoad = false;
        });
        if (!_hasShownCacheNotice) {
          final app = Provider.of<AppState>(context, listen: false);
          await app.setShownCacheNotice(widget.groupId);
          setState(() { _hasShownCacheNotice = true; });
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Расписание загружено из кэша. Ожидаем обновления.')));
        }
      } catch (e) {
        debugPrint('Cache decode error: $e');
      }
    }
    await _loadAll();
  }

  Future<void> _loadAll() async {
    if (!_firstLoad) setState(() { _isRefreshing = true; });

    final prefs = await SharedPreferences.getInstance();
    final cacheKey = 'schedule_cache_${widget.groupId}';
    try {
      final subj = await Api.getSubjectsByGroup(widget.groupId);
      final t = await Api.getTeachers();
      final sched = await Api.getSchedule(widget.groupId);
      final ch = await Api.getScheduleChanges(widget.groupId);

      // ИСПРАВЛЕНО: Конвертируем Map<int, String> в Map<String, String> для безопасного JSON кодирования
      final safeSubjects = _mapIntKeysToString(subj);
      final safeTeachers = _mapIntKeysToString(t);

      final newScheduleJson = jsonEncode({'schedule': sched, 'subjects': safeSubjects, 'teachers': safeTeachers, 'changes': ch});

      // Чтобы избежать ошибки при сравнении, также конвертируем текущие мапы
      final currentScheduleJson = jsonEncode({'schedule': schedule, 'subjects': _mapIntKeysToString(subjects), 'teachers': _mapIntKeysToString(teachers), 'changes': changes});

      if (newScheduleJson == currentScheduleJson && mounted && !_firstLoad) {
        await Future.delayed(const Duration(milliseconds: 200));
        if (mounted) setState(() { _isRefreshing = false; });
        return;
      }

      final mapToStore = {'schedule': sched, 'subjects': safeSubjects, 'teachers': safeTeachers, 'changes': ch};
      await prefs.setString(cacheKey, jsonEncode(mapToStore));

      if (mounted) setState(() {
        subjects = subj;
        teachers = t;
        schedule = sched;
        changes = ch;
        _firstLoad = false;
        _showNoNetBanner = false;
      });
      _listAnim.forward(from: 0);
    } catch (e) {
      debugPrint('schedule load error: $e');
      if (mounted) {
        setState(() {
          _firstLoad = false;
          _showNoNetBanner = true;
        });
      }
    } finally {
      await Future.delayed(const Duration(milliseconds: 200));
      if (mounted) setState(() { _isRefreshing = false; });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      poller?.cancel();
      poller = null;
    } else if (state == AppLifecycleState.resumed && poller == null) {
      poller = Timer.periodic(const Duration(seconds: 60), (_) => _loadAll());
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    poller?.cancel();
    _listAnim.dispose();
    final app = Provider.of<AppState>(context, listen: false);
    app.unsubscribeGroup(widget.groupId);
    super.dispose();
  }

  String weekdayName(int w) {
    const names = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
    return names[(w-1).clamp(0,6)];
  }

  List<Map<String,dynamic>> _applyChanges(List<Map<String,dynamic>> pairs) => applyChangesToPairs(pairs, changes);

  // _dayCard теперь принимает index для анимации
  Widget _dayCard(Map<String, dynamic> day, Color fg, int index) {
    final weekday = (day['weekday'] is num) ? (day['weekday'] as num).toInt() : 1;
    final rawPairs = (day['pairs'] as List? ?? []).cast<Map<String,dynamic>>();
    final pairs = _applyChanges(rawPairs);

    // ЛОГИКА АНИМАЦИИ
    final intervalStart = (index * 0.1).clamp(0.0, 1.0);
    final intervalEnd = (index * 0.1 + 0.4).clamp(0.0, 1.0);
    final animationInterval = Interval(intervalStart, intervalEnd, curve: Curves.easeOutCubic);

    final animation = CurvedAnimation(parent: _listAnim, curve: animationInterval);
    final offset = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero).animate(animation);

    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: offset,
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SizedBox(height: 6),
          Text(weekdayName(weekday), style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: fg)),
          const SizedBox(height: 8),
          ...pairs.map((p) {
            final sid = (p['subject_id'] as num?)?.toInt();
            final tid = (p['teacher_id'] as num?)?.toInt();
            final subj = sid != null ? (subjects[sid] ?? '') : '';
            final teacher = tid != null ? (teachers[tid] ?? '') : '';
            final time = '${p['start_time'] ?? ''} — ${p['end_time'] ?? ''}';
            final cab = p['cabinet'] ?? '';
            final change = changes.firstWhere((c) => c['schedule_id'] == p['id'], orElse: () => {});
            final isCanceled = change.isNotEmpty && (change['is_canceled'] == true);
            final replaced = change.isNotEmpty && (change['new_subject_id'] != null || change['new_teacher_id'] != null);

            BoxDecoration dec = BoxDecoration(borderRadius: BorderRadius.circular(12), color: Theme.of(context).cardColor);
            if (isCanceled) dec = dec.copyWith(color: Colors.red.withOpacity(0.08), border: Border.all(color: Colors.redAccent));
            else if (replaced) dec = dec.copyWith(border: Border.all(color: Colors.white));

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Container(
                decoration: dec,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(subj, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: fg)),
                      const SizedBox(height: 6),
                      Text(teacher, style: TextStyle(fontSize: 13, color: fg.withOpacity(0.8))),
                      const SizedBox(height: 6),
                      if (cab.isNotEmpty) Text('Каб.: $cab', style: TextStyle(fontSize: 12, color: fg.withOpacity(0.6))),
                    ])),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(time, style: TextStyle(fontSize: 13, color: fg.withOpacity(0.8))),
                    ]),
                  ]),
                ),
              ),
            );
          }).toList(),
          const SizedBox(height: 10),
        ]),
      ),
    );
  }

  // ИСПРАВЛЕНО: Горизонтальный скролл с корректным отображением замен и белым бордером.
  Widget _buildLandscapeGrid(BoxConstraints constraints) {
    final fg = Theme.of(context).colorScheme.onBackground;

    return ListView.builder(
      scrollDirection: Axis.horizontal, // ГЛАВНОЕ: Горизонтальный скролл
      itemCount: schedule.length,
      itemBuilder: (_, i) {
        final day = schedule[i];
        final weekday = (day['weekday'] as num?)?.toInt() ?? 1;
        final rawPairs = (day['pairs'] as List? ?? []).cast<Map<String,dynamic>>();
        final pairs = _applyChanges(rawPairs); // Применяем изменения для получения актуальных данных

        return Container(
          // Каждый день занимает 90% ширины экрана для удобного скролла
            width: constraints.maxWidth * 0.9,
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: Theme.of(context).cardColor
              ),
              child: ListView( // Внутренний вертикальный скролл для пар дня
                children: [
                  Text(weekdayName(weekday), style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: fg)),
                  const SizedBox(height: 8),

                  ...pairs.map((p) {
                    final sid = (p['subject_id'] as num?)?.toInt();
                    final tid = (p['teacher_id'] as num?)?.toInt();
                    final subj = sid != null ? (subjects[sid] ?? '') : '';
                    final teacher = tid != null ? (teachers[tid] ?? '') : '';
                    final time = '${p['start_time'] ?? ''} — ${p['end_time'] ?? ''}';
                    final cab = p['cabinet'] ?? '';

                    final change = changes.firstWhere((c) => c['schedule_id'] == p['id'], orElse: () => {});
                    final isCanceled = change.isNotEmpty && (change['is_canceled'] == true);
                    final replaced = change.isNotEmpty && (change['new_subject_id'] != null || change['new_teacher_id'] != null);

                    BoxDecoration pairDec = BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      color: Theme.of(context).cardColor,
                    );

                    if (isCanceled) {
                      pairDec = pairDec.copyWith(color: Colors.red.withOpacity(0.08), border: Border.all(color: Colors.redAccent, width: 1));
                    } else if (replaced) {
                      // ВОССТАНОВЛЕНО: Белый бордер для замененных пар
                      pairDec = pairDec.copyWith(border: Border.all(color: Colors.white, width: 1));
                    }

                    // Стиль для элементов внутри горизонтального скролла
                    return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Container(
                            decoration: pairDec,
                            padding: const EdgeInsets.all(10),
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(subj, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: fg)),
                              const SizedBox(height: 4),
                              Text(teacher, style: TextStyle(fontSize: 13, color: fg.withOpacity(0.8))),
                              const SizedBox(height: 4),
                              if (cab.isNotEmpty) Text('Каб.: $cab', style: TextStyle(fontSize: 12, color: fg.withOpacity(0.6))),
                              const SizedBox(height: 4),
                              Text(time, style: TextStyle(fontSize: 13, color: fg.withOpacity(0.8))),
                            ]
                            )
                        )
                    );
                  }).toList(),
                ],
              ),
            )
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppState>(context);
    final fg = Theme.of(context).colorScheme.onBackground;

    final showBack = app.isLogged || app.hasPinnedGroup;

    return Scaffold(
      appBar: ModernAppBar(title: widget.groupName.isNotEmpty ? widget.groupName : 'Расписание', showBackButton: showBack, onBack: () {
        if (showBack) Navigator.of(context).pop();
      }),
      body: SafeArea(
        child: Stack(children: [
          if (_firstLoad) const Center(child: CircularProgressIndicator()),
          if (!_firstLoad) LayoutBuilder(builder: (context, constraints) {
            final isLandscape = constraints.maxWidth > constraints.maxHeight;
            if (isLandscape) {
              return _buildLandscapeGrid(constraints);
            } else {
              return RefreshIndicator(
                onRefresh: _loadAll,
                child: ListView(padding: const EdgeInsets.all(12), children: [
                  for (int i = 0; i < schedule.length; i++) _dayCard(schedule[i], fg, i),
                  const SizedBox(height: 24),
                ]),
              );
            }
          }),
          if (_isRefreshing) Positioned(top: 0, left: 0, right: 0, child: LinearProgressIndicator(minHeight: 3, color: Theme.of(context).colorScheme.primary)),
          // animated no-network banner
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            top: _showNoNetBanner ? 0 : -60,
            left: 0,
            right: 0,
            height: 56,
            child: Container(
              color: Colors.orange.shade700,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(children: const [
                Icon(Icons.wifi_off, color: Colors.white),
                SizedBox(width: 12),
                Expanded(child: Text('Нет сети — показан кэш ', style: TextStyle(color: Colors.white))),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}