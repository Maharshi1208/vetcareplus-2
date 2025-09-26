import fs from 'fs';

export function isDocker(): boolean {
  try {
    if (fs.existsSync('/.dockerenv')) return true;
    // Fallback: many containers have "docker" in cgroup
    const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
    return /docker|containerd|kubepods/i.test(cgroup);
  } catch {
    return false;
  }
}
