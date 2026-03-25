// ─────────────────────────────────────────────
//  Custom Hooks — React Query wrappers
// ─────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';

// ── HELPERS ──────────────────────────────────
const onErr = err => toast.error(err.response?.data?.error || err.message || 'Error');

// ── TEST CASES ───────────────────────────────
export const useTestCases = (filters = {}) =>
  useQuery({
    queryKey: ['test-cases', filters],
    queryFn: () => api.get('/test-cases', { params: filters }).then(r => r.data),
  });

export const useTestCase = id =>
  useQuery({
    queryKey: ['test-case', id],
    queryFn: () => api.get(`/test-cases/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateTC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/test-cases', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success('Test case created');
    },
    onError: onErr,
  });
};

export const useUpdateTC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/test-cases/${id}`, data).then(r => r.data),
    onSuccess: (data, vars) => {
      // Update the test case query with the new data
      qc.setQueryData(['test-case', vars.id], data);
      // Invalidate the list to refetch
      qc.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success('Test case updated');
    },
    onError: onErr,
  });
};

export const useDeleteTC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/test-cases/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success('Test case deleted');
    },
    onError: onErr,
  });
};

export const useBulkDeleteTC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ids => api.delete('/test-cases', { data: { ids } }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-cases'] });
      toast.success('Test cases deleted');
    },
    onError: onErr,
  });
};

export const useModules = () =>
  useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/test-cases/meta/modules').then(r => r.data),
  });

// ── BUGS ─────────────────────────────────────
export const useBugs = (filters = {}) =>
  useQuery({
    queryKey: ['bugs', filters],
    queryFn: () => api.get('/bugs', { params: filters }).then(r => r.data),
    refetchInterval: 2000,
  });

export const useCreateBug = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/bugs', data).then(r => r.data),
    onSuccess: data => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`Bug reported — ${data.bug_id}`);
    },
    onError: onErr,
  });
};

export const useUpdateBug = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/bugs/${id}`, data).then(r => r.data),
    onSuccess: data => {
      qc.refetchQueries({ queryKey: ['bugs'] });
      toast.success('Bug updated');
    },
    onError: onErr,
  });
};

export const useDeleteBug = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/bugs/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug deleted');
    },
    onError: onErr,
  });
};

// ── TESTERS ──────────────────────────────────
export const useTesters = () =>
  useQuery({ queryKey: ['testers'], queryFn: () => api.get('/testers').then(r => r.data) });

export const useCreateTester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/testers', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testers'] });
      toast.success('Tester added');
    },
    onError: onErr,
  });
};

export const useUpdateTester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/testers/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testers'] });
      toast.success('Tester updated');
    },
    onError: onErr,
  });
};

export const useDeleteTester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/testers/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testers'] });
      toast.success('Tester removed');
    },
    onError: onErr,
  });
};

// ── DEVELOPERS ───────────────────────────────
export const useDevelopers = () =>
  useQuery({
    queryKey: ['developers'],
    queryFn: () => api.get('/users/developers').then(r => r.data),
  });

export const useCreateDev = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/users/developers', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['developers'] });
      toast.success('Developer linked');
    },
    onError: onErr,
  });
};

export const useDeleteDev = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/users/developers/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['developers'] });
      toast.success('Developer removed');
    },
    onError: onErr,
  });
};

// ── MANAGERS ────────────────────────────────
export const useManagers = () =>
  useQuery({ queryKey: ['managers'], queryFn: () => api.get('/managers').then(r => r.data) });

export const useCreateManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/managers', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager added');
    },
    onError: onErr,
  });
};

export const useUpdateManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/managers/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager updated');
    },
    onError: onErr,
  });
};

export const useDeleteManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/managers/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager removed');
    },
    onError: onErr,
  });
};

// ── TEST RUNS ────────────────────────────────
export const useRuns = () =>
  useQuery({ queryKey: ['runs'], queryFn: () => api.get('/runs').then(r => r.data) });

export const useCreateRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/runs', data).then(r => r.data),
    onSuccess: data => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      toast.success(`Run created — ${data.run_id}`);
    },
    onError: onErr,
  });
};

export const useDeleteRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/runs/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      toast.success('Run deleted');
    },
    onError: onErr,
  });
};

// ── COMMENTS ─────────────────────────────────
export const useComments = params =>
  useQuery({
    queryKey: ['comments', params],
    queryFn: () => api.get('/comments', { params }).then(r => r.data),
    enabled: Object.values(params).some(Boolean),
  });

export const usePostComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/comments', data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      if (vars.tc_id) qc.invalidateQueries({ queryKey: ['test-case', vars.tc_id] });
    },
    onError: onErr,
  });
};

// ── NOTIFICATIONS ─────────────────────────────
export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000, // Poll every 30s
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id =>
      id === 'all'
        ? api.patch('/notifications/mark-all-read').then(r => r.data)
        : api.patch(`/notifications/${id}/read`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// ── USERS (for @mention autocomplete + team activity) ────────
export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every 60s for live team activity
  });

// ── MENTION TOAST ────────────────────────────
import { useEffect, useRef } from 'react';

export const useMentionToast = () => {
  const { data: notifs = [] } = useNotifications();
  const prevCountRef = useRef(0);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    const unreadMentions = notifs.filter(n => !n.is_read && n.type === 'mention');

    // On first load, just record existing IDs without toasting
    if (prevCountRef.current === 0 && unreadMentions.length > 0) {
      unreadMentions.forEach(n => seenIdsRef.current.add(n.id));
      prevCountRef.current = unreadMentions.length;
      return;
    }

    // Show toast for NEW mention notifications we haven't seen
    unreadMentions.forEach(n => {
      if (!seenIdsRef.current.has(n.id)) {
        seenIdsRef.current.add(n.id);
        toast(n.title, {
          icon: '👋',
          duration: 6000,
          style: {
            border: '1px solid var(--primary)',
            fontWeight: 500,
          },
        });
      }
    });

    prevCountRef.current = unreadMentions.length;
  }, [notifs]);
};

// ── REPORTS ───────────────────────────────────
export const useReportSummary = () =>
  useQuery({
    queryKey: ['report-summary'],
    queryFn: () => api.get('/reports/summary').then(r => r.data),
  });

export const useTesterPerformance = () =>
  useQuery({
    queryKey: ['tester-performance'],
    queryFn: () => api.get('/reports/tester-performance').then(r => r.data),
  });

// ── PROFILE ───────────────────────────────────
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: data => api.patch('/users/profile', data).then(r => r.data),
    onSuccess: () => toast.success('Profile saved'),
    onError: onErr,
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: data => api.patch('/auth/change-password', data).then(r => r.data),
    onSuccess: () => toast.success('Password changed'),
    onError: onErr,
  });
};
// ── PROJECTS ──────────────────────────────────
export const useProjects = (filters = {}) =>
  useQuery({
    queryKey: ['projects', filters],
    queryFn: () => api.get('/projects', { params: filters }).then(r => r.data),
    refetchInterval: 2000, // Real-time updates
  });

export const useProject = id =>
  useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/projects', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: onErr,
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/projects/${id}`, data).then(r => r.data),
    onSuccess: (data, vars) => {
      qc.setQueryData(['project', vars.id], data);
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
    onError: onErr,
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: onErr,
  });
};

// ── TEST CASE ATTACHMENTS ────────────────────
export const useAttachments = tcId =>
  useQuery({
    queryKey: ['attachments', tcId],
    queryFn: () => api.get(`/test-cases/${tcId}/attachments`).then(r => r.data),
    enabled: !!tcId,
  });

export const useUploadAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tcId, files }) => {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      return api
        .post(`/test-cases/${tcId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(r => r.data);
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['attachments', vars.tcId] });
      qc.invalidateQueries({ queryKey: ['test-case', vars.tcId] });
      toast.success(`${data.length} file(s) uploaded`);
    },
    onError: onErr,
  });
};

export const useDeleteAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tcId, attachmentId }) =>
      api.delete(`/test-cases/${tcId}/attachments/${attachmentId}`).then(r => r.data),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['attachments', vars.tcId] });
      qc.invalidateQueries({ queryKey: ['test-case', vars.tcId] });
      toast.success('Attachment deleted');
    },
    onError: onErr,
  });
};
