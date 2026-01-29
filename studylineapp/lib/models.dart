// lib/models.dart
class Group {
  final int id;
  final String name;
  final int shift;
  Group({required this.id, required this.name, required this.shift});
  factory Group.fromJson(Map<String, dynamic> j) => Group(
    id: (j['id'] as num).toInt(),
    name: j['name'] ?? 'Группа ${(j['id'] ?? '')}',
    shift: j['shift'] != null ? (j['shift'] as num).toInt() : 1,
  );
}
