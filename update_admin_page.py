import re

with open('src/app/admin/page.tsx', 'r') as f:
    content = f.read()

# 1. Add Passes Tab
if 'id: \'passes\'' not in content:
    content = content.replace(
        "{ id: 'classes', label: 'Classes',",
        "{ id: 'passes', label: 'Passes', icon: (\n    <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"></path><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\" ry=\"1\"></rect></svg>\n  ) },\n  { id: 'classes', label: 'Classes',"
    )

# 2. Add interface PassOptionRow
if 'interface PassOptionRow' not in content:
    content = content.replace(
        "interface ClassRow {",
        "interface PassOptionRow {\n  id: string;\n  name: string;\n  description?: string;\n  priceUsd: string;\n  totalClasses?: number;\n  validityDays?: number;\n  isActive: boolean;\n  createdAt: string;\n}\n\ninterface ClassRow {"
    )

# 3. Add states
if 'const [passOptions, setPassOptions]' not in content:
    content = content.replace(
        "const [classes, setClasses] = useState<ClassRow[]>([]);",
        "const [passOptions, setPassOptions] = useState<PassOptionRow[]>([]);\n  const [passOptionsLoading, setPassOptionsLoading] = useState(false);\n  const [editingPassOptionId, setEditingPassOptionId] = useState<string | null>(null);\n  const [classes, setClasses] = useState<ClassRow[]>([]);"
    )

# 4. Add fetchPassOptions
if 'const fetchPassOptions' not in content:
    fetch_fn = """
  const fetchPassOptions = useCallback(async () => {
    if (!token) return;
    setPassOptionsLoading(true);
    try {
      const res = await apiGet<any>('/passes/admin/options', token);
      setPassOptions(Array.isArray(res) ? res : res.data ?? []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load passes', true);
    } finally {
      setPassOptionsLoading(false);
    }
  }, [token, showToast]);
"""
    content = content.replace(
        "const fetchClasses = useCallback(async () => {",
        fetch_fn + "\n  const fetchClasses = useCallback(async () => {"
    )

# 5. Add to useEffect
content = content.replace(
    "fetchTestimonials();\n    }",
    "fetchTestimonials();\n      fetchPassOptions();\n    }"
)
content = content.replace(
    ", fetchTestimonials]);",
    ", fetchTestimonials, fetchPassOptions]);"
)

# 6. Add modal handlers
if 'modalType === \'addPass\'' not in content:
    modal_logic = """
      } else if (modalType === 'addPass') {
        const payload: any = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
        };
        const totalClasses = formData.get('totalClasses') as string;
        if (totalClasses) payload.totalClasses = parseInt(totalClasses);
        
        const validityDays = formData.get('validityDays') as string;
        if (validityDays) payload.validityDays = parseInt(validityDays);

        await apiPost('/passes/admin/options', payload, token);
        showToast('Pass Option created successfully!');
        await fetchPassOptions();

      } else if (modalType === 'editPass') {
        const payload: any = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          priceUsd: parseFloat(formData.get('priceUsd') as string),
          isActive: formData.get('isActive') === 'true',
          totalClasses: null,
          validityDays: null
        };
        const totalClasses = formData.get('totalClasses') as string;
        if (totalClasses) payload.totalClasses = parseInt(totalClasses);
        
        const validityDays = formData.get('validityDays') as string;
        if (validityDays) payload.validityDays = parseInt(validityDays);

        await apiPatch(`/passes/admin/options/${editingPassOptionId}`, payload, token);
        showToast('Pass Option updated successfully!');
        await fetchPassOptions();
"""
    content = content.replace(
        "} else if (modalType === 'editClass') {",
        modal_logic + "\n      } else if (modalType === 'editClass') {"
    )

# 7. Add delete handler for pass
if 'itemToDelete.type === \'pass\'' not in content:
    del_logic = """
      } else if (itemToDelete.type === 'pass') {
        await apiDelete(`/passes/admin/options/${itemToDelete.id}`, token!);
        setPassOptions(prev => prev.filter(c => c.id !== itemToDelete.id));
        showToast('Pass deleted successfully');
"""
    content = content.replace(
        "} else if (itemToDelete.type === 'class') {",
        del_logic + "\n      } else if (itemToDelete.type === 'class') {"
    )

# 8. Derived data
if 'const editingPassOption' not in content:
    content = content.replace(
        "const editingClass = classes.find",
        "const editingPassOption = passOptions.find(p => p.id === editingPassOptionId);\n  const editingClass = classes.find"
    )

# 9. Add close modal reset
content = content.replace("setEditingInstructorId(null);", "setEditingInstructorId(null);\n    setEditingPassOptionId(null);")


with open('src/app/admin/page.tsx', 'w') as f:
    f.write(content)
print("Updated basic logic")
