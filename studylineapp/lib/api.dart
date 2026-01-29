// lib/api.dart
import 'package:dio/dio.dart';

class Api {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://95.58.68.153:1200', // <<-- ЗАМЕНИ на production URL
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 8),
  ));

  static void setToken(String? token) {
    if (token == null) {
      _dio.options.headers.remove('Authorization');
    } else {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  static List<dynamic> _flatten(dynamic data) {
    if (data is List && data.isNotEmpty && data.first is List) {
      return data.first as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }

  // GET /get_groups
  static Future<List<Map<String, dynamic>>> getGroups() async {
    final r = await _dio.get('/get_groups');
    final flat = _flatten(r.data);
    return List<Map<String, dynamic>>.from(flat);
  }

  // GET /get_subjects_by_group_id/{id}
  static Future<Map<int, String>> getSubjectsByGroup(int groupId) async {
    final r = await _dio.get('/get_subjects_by_group_id/$groupId');
    final flat = _flatten(r.data);
    final map = <int, String>{};
    for (var s in flat) {
      if (s is Map && s['id'] != null) {
        final id = (s['id'] as num).toInt();
        map[id] = s['name'] ?? 'Предмет $id';
      }
    }
    return map;
  }

  // GET /get_teachers
  static Future<Map<int, String>> getTeachers() async {
    final r = await _dio.get('/get_teachers');
    final flat = _flatten(r.data);
    final map = <int, String>{};
    for (var t in flat) {
      if (t is Map && t['id'] != null) {
        final id = (t['id'] as num).toInt();
        map[id] = t['full_name'] ?? 'Преподаватель $id';
      }
    }
    return map;
  }

  // GET /get_schedule/{group_id}
  static Future<List<Map<String, dynamic>>> getSchedule(int groupId) async {
    final r = await _dio.get('/get_schedule/$groupId');
    final flat = _flatten(r.data);
    return List<Map<String, dynamic>>.from(flat);
  }

  // GET /get_schedule_changes/{group_id}
  static Future<List<Map<String, dynamic>>> getScheduleChanges(int groupId) async {
    final r = await _dio.get('/get_schedule_changes/$groupId');
    final flat = _flatten(r.data);
    return List<Map<String, dynamic>>.from(flat);
  }

  // GET /get_schedule_week/{group_id} (если есть)
  static Future<List<Map<String, dynamic>>> getScheduleWeek(int groupId) async {
    try {
      final r = await _dio.get('/get_schedule_week/$groupId');
      final flat = _flatten(r.data);
      return List<Map<String, dynamic>>.from(flat);
    } catch (_) {
      return getSchedule(groupId);
    }
  }

  // POST /login
  static Future<Map<String, dynamic>> login(String login, String password) async {
    final r = await _dio.post('/login', data: {'login': login, 'password': password});
    return Map<String, dynamic>.from(r.data);
  }

  // POST /logout
  static Future<void> logout(String token) async {
    await _dio.post('/logout', data: {'token': token});
  }
}
