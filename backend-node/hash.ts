import bcrypt from "bcryptjs";

(async () => {
  const hash = await bcrypt.hash("demo123", 10);
  console.log(hash);
})();