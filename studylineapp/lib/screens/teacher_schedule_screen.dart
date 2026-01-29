// lib/screens/teacher_schedule_screen.dart
import 'dart:async';
import 'dart:convert'; // Для сравнения данных
import 'package:flutter/material.dart';
import '../api.dart';
import '../widgets/custom_appbar.dart';
import '../utils.dart';

class TeacherScheduleScreen extends StatefulWidget {
  final int teacherId;
  const TeacherScheduleScreen({super.key, required this.teacherId});

  @override
  State<TeacherScheduleScreen> createState() => _TeacherScheduleScreenState();
}

class _TeacherScheduleScreenState extends State<TeacherScheduleScreen> {
  bool loading = true;
  List<Map<String, dynamic>> pairs = [];
  Map<int, String> subjects = {};
  Map<int, String> groups = {}; // Добавлено для хранения имен групп
  Timer? poller;
  bool _isManualLoad = true; // Для управления индикатором загрузки

  @override
  void initState() {
    super.initState();
    _load();
    // NEW: Polling frequency decreased to 60 seconds
    poller = Timer.periodic(const Duration(seconds: 30), (_) => _load(isManual: false));
  }

  String weekdayName(int w) {
    const names = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
    return names[(w-1).clamp(0,6)];
  }

  Future<void> _load({bool isManual = true}) async {
    // Показываем индикатор только при первом или ручном запуске
    if (isManual) {
      setState(() => loading = true);
    }

    try {
      final allGroups = await Api.getGroups();
      final subjMap = <int, String>{};
      final groupsMap = <int, String>{};
      final found = <Map<String,dynamic>>[];

      for (var g in allGroups) {
        final gid = (g['id'] as num).toInt();
        final gName = (g['name'] as String?)?.trim() ?? 'Группа $gid';
        groupsMap[gid] = gName;

        final subs = await Api.getSubjectsByGroup(gid);
        subjMap.addAll(subs);
        final sched = await Api.getSchedule(gid);
        final ch = await Api.getScheduleChanges(gid);

        for (var day in sched) {
          final weekday = (day['weekday'] as num?)?.toInt() ?? 1;
          final rawPairs = (day['pairs'] as List).cast<Map<String,dynamic>>();
          final applied = applyChangesToPairs(rawPairs, ch);

          for (var p in applied) {
            final tid = (p['teacher_id'] as num?)?.toInt();
            if (tid != null && tid == widget.teacherId) {
              final map = Map<String,dynamic>.from(p);
              map['group_id'] = gid;
              map['group_name'] = gName;
              map['weekday'] = weekday;

              final change = ch.firstWhere((c) => c['schedule_id'] == p['id'], orElse: () => {});
              if (change.isNotEmpty) map['__change'] = change;

              found.add(map);
            }
          }
        }
      }

      // Сортировка
      found.sort((a, b) {
        final wA = (a['weekday'] as int?) ?? 8;
        final wB = (b['weekday'] as int?) ?? 8;
        if (wA != wB) return wA.compareTo(wB);

        final tA = a['start_time'] as String? ?? '00:00';
        final tB = b['start_time'] as String? ?? '00:00';
        return tA.compareTo(tB);
      });

      // Обнаружение параллельных занятий (коллизий по времени)
      final Map<String, List<Map<String, dynamic>>> timeGroups = {};
      for (var p in found) {
        final key = '${p['weekday']}_${p['start_time']}';
        timeGroups.putIfAbsent(key, () => []).add(p);
      }
      for (var group in timeGroups.values) {
        if (group.length > 1) {
          for (var p in group) {
            p['is_time_collision'] = true;
          }
        }
      }

      // NEW: Сравнение данных для предотвращения мерцания
      final newPairsJson = jsonEncode(found);
      final currentPairsJson = jsonEncode(pairs);

      if (currentPairsJson == newPairsJson && mounted && !isManual) {
        if (loading) setState(() => loading = false);
        return;
      }
      // --------------------------------------------------

      if (mounted) {
        setState(() {
          subjects = subjMap;
          groups = groupsMap;
          pairs = found;
          loading = false;
          _isManualLoad = false;
        });
      }
    } catch (e) {
      debugPrint('teacher load error: $e');
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void dispose() {
    poller?.cancel();
    super.dispose();
  }

  Widget _buildPairCard(Map<String, dynamic> p, Color fg) {
    final subj = (p['subject_id'] != null) ? (subjects[(p['subject_id'] as num).toInt()] ?? '') : 'Неизвестный предмет';
    final groupName = p['group_name'] as String? ?? 'Группа ${p['group_id'] as num}';
    final time = '${p['start_time'] ?? ''} — ${p['end_time'] ?? ''}';
    final cab = p['cabinet'] ?? '';

    final isCanceled = p.containsKey('is_canceled') && p['is_canceled'] == true;
    final isReplaced = p.containsKey('is_replaced') && p['is_replaced'] == true;
    final isTimeCollision = p.containsKey('is_time_collision') && p['is_time_collision'] == true;

    BoxDecoration deco = BoxDecoration(borderRadius: BorderRadius.circular(12), color: Theme.of(context).cardColor);

    // Приоритеты: 1. Отмена, 2. Замена + Параллель, 3. Параллель, 4. Замена

    if (isCanceled) {
      deco = deco.copyWith(border: Border.all(color: Colors.redAccent), color: Colors.red.withOpacity(0.08));
    }
    else if (isReplaced && isTimeCollision) {
      // Замена И Параллель: Желтый фон (параллель) + Белый бордер (замена)
      deco = deco.copyWith(
          border: Border.all(color: Colors.white, width: 1.5),
          color: Colors.amber.withOpacity(0.15)
      );
    }
    else if (isTimeCollision) {
      // Только Параллель
      deco = deco.copyWith(
          border: Border.all(color: Colors.amber.shade600, width: 2),
          color: Colors.amber.withOpacity(0.15)
      );
    }
    else if (isReplaced) {
      // Только Замена
      deco = deco.copyWith(border: Border.all(color: Colors.white, width: 1.5));
    }

    final TextStyle textStyle = isCanceled
        ? TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: Colors.red.shade400,
      decoration: TextDecoration.lineThrough,
      decorationColor: Colors.redAccent,
    )
        : TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: fg);


    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Container(
        decoration: deco,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(subj, style: textStyle),
              const SizedBox(height: 6),
              Text(groupName, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.75))),
              if (cab.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text('Каб.: $cab', style: TextStyle(fontSize: 12, color: fg.withOpacity(0.6))),
              ]
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(time, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.85)))
            ]),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        appBar: ModernAppBar(title: 'Моё расписание', showBackButton: true),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final fg = Theme.of(context).colorScheme.onBackground;

    final Map<int, List<Map<String, dynamic>>> groupedPairs = {};
    for (var p in pairs) {
      final w = (p['weekday'] as int?) ?? 8;
      if (!groupedPairs.containsKey(w)) {
        groupedPairs[w] = [];
      }
      groupedPairs[w]!.add(p);
    }

    final sortedWeekdays = groupedPairs.keys.toList()..sort();

    if (pairs.isEmpty) {
      return const Scaffold(
        appBar: ModernAppBar(title: 'Моё расписание', showBackButton: true),
        body: Center(child: Text('Расписание не найдено.')),
      );
    }

    return Scaffold(
      appBar: const ModernAppBar(title: 'Моё расписание', showBackButton: true),
      body: ListView.builder(
        padding: const EdgeInsets.only(top: 12, left: 12, right: 12),
        itemCount: sortedWeekdays.length,
        itemBuilder: (_, i) {
          final weekday = sortedWeekdays[i];
          final dayPairs = groupedPairs[weekday]!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(weekdayName(weekday),
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: fg)),
              const SizedBox(height: 8),
              ...dayPairs.map((p) => _buildPairCard(p, fg)).toList(),
              const SizedBox(height: 16),
            ],
          );
        },
      ),
    );
  }
}