// lib/utils.dart
import 'package:intl/intl.dart';

DateTime parseDate(String? s) {
  if (s == null) return DateTime.now();
  try {
    return DateTime.parse(s);
  } catch (_) {
    return DateTime.now();
  }
}

/// Мержим расписание + изменения: если change.countains(schedule_id) — заменяем поля.
/// Упрощённо: возвращаем список pairs с применёнными заменами (работает если change содержит schedule_id)
List<Map<String, dynamic>> applyChangesToPairs(List<Map<String, dynamic>> pairs, List<Map<String, dynamic>> changes) {
  final out = <Map<String, dynamic>>[];
  for (var p in pairs) {
    final id = p['id'];
    final change = changes.firstWhere(
          (c) => c['schedule_id'] == id,
      orElse: () => {},
    );

    final copy = Map<String, dynamic>.from(p);

    if (change.isNotEmpty) {
      if (change['is_canceled'] == true) {
        // !!! ИЗМЕНЕНИЕ: Добавляем флаг отмены и не применяем другие изменения
        copy['is_canceled'] = true;
      } else {
        // Применяем изменения (замены)
        if (change['new_subject_id'] != null) copy['subject_id'] = change['new_subject_id'];
        if (change['new_teacher_id'] != null) copy['teacher_id'] = change['new_teacher_id'];
        if (change['new_start_time'] != null) copy['start_time'] = change['new_start_time'];
        if (change['new_end_time'] != null) copy['end_time'] = change['new_end_time'];
        if (change['new_cabinet'] != null) copy['cabinet'] = change['new_cabinet'];
        copy['is_replaced'] = true; // Добавляем флаг замены для стилизации
      }
    }

    out.add(copy); // Добавляем пару (даже отмененную)
  }
  return out;
}
