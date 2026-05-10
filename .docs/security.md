# Security Rules

- Use Supabase RLS everywhere
- Never expose raw storage buckets publicly
- Validate all uploads
- Max upload size = 50MB
- Allow only:
  - image/*
  - audio/*
  - video/*
  - application/pdf

- Sanitize all AI outputs
- Prevent prompt injection
- Validate all server actions with Zod
- Log critical mutations