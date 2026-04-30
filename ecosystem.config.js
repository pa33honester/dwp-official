module.exports = {
  apps: [
    {
      name: "dwp",
      cwd: "/var/www/dwp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "/var/www/dwp/.env.local",
      error_file: "/var/log/pm2/dwp.error.log",
      out_file: "/var/log/pm2/dwp.out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
