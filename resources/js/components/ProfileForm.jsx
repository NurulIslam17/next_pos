import { useEffect, useState } from "react";
import { api } from "../api";
import UserPhoto from "./UserPhoto";
import { ErrorBanner, Field, FormActions, inputClass, useSubmit } from "./ui";

export default function ProfileForm({ user, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        nid_number: user.nid_number ?? "",
        date_of_birth: user.date_of_birth ?? "",
        joining_date: user.joining_date ?? "",
        bank_name: user.bank_name ?? "",
        salary_account_name: user.salary_account_name ?? "",
        salary_account_number: user.salary_account_number ?? "",
        permanent_address: user.permanent_address ?? "",
        present_address: user.present_address ?? "",
    });
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const { first, message, isSaving, submit } = useSubmit();

    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    const set = (key) => (event) =>
        setForm({ ...form, [key]: event.target.value });

    const handlePhoto = (event) => {
        const file = event.target.files?.[0] ?? null;
        if (preview) URL.revokeObjectURL(preview);
        setPhoto(file);
        setPreview(file ? URL.createObjectURL(file) : null);
        setRemovePhoto(false);
        event.target.value = "";
    };

    const handleRemove = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPhoto(null);
        setPreview(null);
        setRemovePhoto(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const body = new FormData();
        body.append("_method", "PUT");
        Object.entries(form).forEach(([key, value]) => body.append(key, value ?? ""));
        if (photo) body.append("photo", photo);
        if (removePhoto) body.append("remove_photo", "1");

        const ok = await submit(async () => {
            const response = await api("/profile", { method: "POST", body });
            onSaved(response.data);
        });

        if (ok) setRemovePhoto(false);
    };

    const photoUser = {
        name: form.name,
        photo_url: removePhoto ? null : preview || user.photo_url,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />

            <div className="flex items-center gap-4">
                <UserPhoto user={photoUser} className="h-20 w-20 rounded-full object-cover ring-1 ring-slate-200" />
                <div className="space-y-2">
                    <Field label="Profile photo" error={first("photo")}>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhoto}
                            className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </Field>
                    {user.photo_url && !removePhoto && (
                        <button type="button" onClick={handleRemove} className="text-xs font-medium text-red-600 hover:text-red-500">
                            Remove photo
                        </button>
                    )}
                    {removePhoto && <span className="block text-xs text-slate-500">Photo will be removed.</span>}
                </div>
            </div>

            <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" error={first("name")}>
                        <input className={inputClass} value={form.name} onChange={set("name")} required />
                    </Field>
                    <Field label="Email" error={first("email")}>
                        <input type="email" className={inputClass} value={form.email} onChange={set("email")} required />
                    </Field>
                    <Field label="Phone" error={first("phone")}>
                        <input className={inputClass} value={form.phone} onChange={set("phone")} />
                    </Field>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Personal &amp; payroll</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="NID number" error={first("nid_number")}>
                        <input className={inputClass} value={form.nid_number} onChange={set("nid_number")} />
                    </Field>
                    <Field label="Date of birth" error={first("date_of_birth")}>
                        <input type="date" className={inputClass} value={form.date_of_birth} onChange={set("date_of_birth")} />
                    </Field>
                    <Field label="Joining date" error={first("joining_date")}>
                        <input type="date" className={inputClass} value={form.joining_date} onChange={set("joining_date")} />
                    </Field>
                    <Field label="Bank name" error={first("bank_name")}>
                        <input className={inputClass} value={form.bank_name} onChange={set("bank_name")} />
                    </Field>
                    <Field label="Salary account name" error={first("salary_account_name")}>
                        <input className={inputClass} value={form.salary_account_name} onChange={set("salary_account_name")} />
                    </Field>
                    <Field label="Salary account number" error={first("salary_account_number")}>
                        <input className={inputClass} value={form.salary_account_number} onChange={set("salary_account_number")} />
                    </Field>
                </div>
                <Field label="Permanent address" error={first("permanent_address")}>
                    <input className={inputClass} value={form.permanent_address} onChange={set("permanent_address")} />
                </Field>
                <Field label="Present address" error={first("present_address")}>
                    <input className={inputClass} value={form.present_address} onChange={set("present_address")} />
                </Field>
            </fieldset>

            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}
