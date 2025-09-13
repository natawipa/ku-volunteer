import { z } from "zod";

export const validationSchema = z
    .object({
        email: z.string().email({ message: "อีเมลไม่ถูกต้อง" }),
        password: z.string()
            .min(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัว" })
            .regex(/[A-Z]/, { message: "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว" })
            .regex(/[!#$%^&*()+=\-[\]{};':"\\|,.<>/?]/, { message: "รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว" }),
        confirm: z.string().min(8, { message: "โปรดกรอกข้อมูล" }),   
        year: z.coerce.number()
            .min(1, { message: "โปรดกรอกข้อมูล" })
            .max(6, { message: "ชั้นปีต้องไม่เกิน 6" }),
})

.refine((data) => data.password === data.confirm, {
    message: "รหัสผ่านไม่ตรงกัน",
    // display error at confirm box
    path: ["confirm"],
});