import os
import json
import requests
import shutil

# [SECURITY FIX] المفتاح كان مكتوب صراحة هنا — تم كشفه بمستودع عام وله خطر حقيقي.
# يجب إلغاء المفتاح القديم من Google AI Studio فوراً وإنشاء مفتاح جديد.
# المفتاح الجديد يُقرأ الآن من متغير بيئة GEMINI_API_KEY فقط — لا يُكتب بالكود إطلاقاً.
API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    raise SystemExit("❌ GEMINI_API_KEY غير مضبوط. شغّل: export GEMINI_API_KEY=مفتاحك_الجديد")

def read_all_files(path):
    project_content = ""
    full_path = os.path.expanduser(path)
    
    if os.path.isfile(full_path):
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f"📂 ملف: {os.path.basename(full_path)}\n---\n{f.read()}\n---\n"
        except Exception:
            return None
            
    elif os.path.isdir(full_path):
        print(f"🔍 جاري فحص وقراءة ملفات: {path} ...")
        allowed_extensions = ('.py', '.js', '.sh', '.json', '.html', '.css', '.txt', '.php', '.cpp', '.c')
        for root, dirs, files in os.walk(full_path):
            # تخطي المجلدات غير المرغوبة والنسخ الاحتياطية
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'venv', '__pycache__', 'backup_old')]
            for file in files:
                if file.endswith(allowed_extensions):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, full_path)
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            project_content += f"\n📂 مسار الملف: {relative_path}\n"
                            project_content += f"====================\n"
                            project_content += f"{f.read()}\n"
                            project_content += f"====================\n"
                    except Exception:
                        continue
        return project_content
    else:
        return None

def ask_gemini(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    try:
        response = requests.post(url, headers=headers, json=data)
        return response.json()['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        return f"❌ خطأ: {e}"

def safe_write_file(base_dir, relative_path, content):
    """تقوم بإنشاء المجلدات وحفظ الملف بأمان"""
    full_path = os.path.join(os.path.expanduser(base_dir), relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"💾 تم حفظ: {relative_path}")

if __name__ == "__main__":
    print("="*45)
    print("🤖 مساعد الدمج الاحترافي لـ Widbid 🤖")
    print("="*45)
    
    # تحديد المسارات تلقائياً بناءً على طلبك لراحتك الكاملة
    path1 = "~/widgemi"            # الواجهة الحديثة
    path2 = "~/widbid2/widbid2"    # الكود القديم والمنطق البرمجي
    output_dir = "~/widbid2"       # المجلد الجديد المستهدف للدمج
    
    print(f"1️⃣ مسار الواجهة الحديثة المعتمد: {path1}")
    content1 = read_all_files(path1)
    if not content1:
        print("❌ خطأ: لم يتم العثور على مجلد الواجهة الحديثة ~/widgemi")
        exit()
        
    print(f"2️⃣ مسار الكود القديم المعتمد: {path2}")
    content2 = read_all_files(path2)
    if not content2:
        print("❌ خطأ: لم يتم العثور على مجلد الكود القديم ~/widbid2/widbid2")
        exit()

    # إجراء احترازي: أخذ نسخة احتياطية من المجلد القديم قبل أي كتابة
    backup_path = os.path.expanduser("~/widbid2_backup_old")
    if os.path.exists(os.path.expanduser(output_dir)) and not os.path.exists(backup_path):
        print("\n📦 جاري إنشاء نسخة احتياطية من ملفاتك القديمة في ~/widbid2_backup_old للأمان...")
        try:
            shutil.copytree(os.path.expanduser(output_dir), backup_path, dirs_exist_ok=True)
            print("✅ تم حفظ النسخة الاحتياطية بنجاح.")
        except Exception as e:
            print(f"⚠️ تحذير أثناء النسخ الاحتياطي: {e}")

    print("\n✅ تم تحميل وقراءة المشروعين بنجاح دون تعديل أي ملف أصلي!")
    print(f"🎯 سيتم دمج الكود وحفظ النسخة النهائية الاحترافية مباشرة في: {output_dir}\n")

    while True:
        instruction = input("💬 اضغط Enter لبدء الدمج الاحترافي تلقائياً، أو اكتب تعليقاً خاصاً: ").strip()
        if instruction.lower() in ['خروج', 'exit', 'quit']:
            break
            
        if not instruction:
            instruction = "قم بدمج واجهة المستخدم الحديثة مع المنطق والوظائف القديمة وربط الأزرار باحترافية."

        print("\n🤖 جاري معالجة وربط الأكواد وحل التعارضات عبر Gemini (يرجى الانتظار)...")
        
        prompt = f"""
        لديك مشروعان كاملان:
        
        --- المشروع الأول (مجلد الواجهة الحديثة والتصميم) ---
        {content1}
        
        --- المشروع الثاني (مجلد الكود والمنطق والوظائف القديمة) ---
        {content2}
        
        المطلوب:
        قم بدمج المشروعين معاً لإنتاج نسخة ثالثة مدمجة واحترافية بالكامل ليتم حفظها في المجلد النهائي.
        
        💡 آلية الدمج وشروط الربط الاحترافية المطلوبة:
        1. قم بربط كافة عناصر واجهة المستخدم الحديثة (الأزرار، النماذج Forms، القوائم) بالوظائف والدوال المقابلة لها في الملفات القديمة (مثل دوال الـ JavaScript أو الـ Backend).
        2. تأكد من مطابقة الـ IDs والـ Classes وعناوين الدوال برمجياً لتعمل الأحداث (Event Listeners مثل click و submit) بدون أي أخطاء أو تعارضات (Conflict Resolution).
        3. قم بإنشاء بنية ملفات نظيفة تجمع ميزات التصميم الجديد وأداء الكود القديم.
        
        أرجع لي الأكواد المدمجة والجديدة فقط منسقة بصيغة JSON كالتالي لكي أقوم بحفظها تلقائياً للمستخدم:
        {{
            "اسم_الملف_النسبي_1": "محتوى الكود البرمجي بالكامل هنا",
            "اسم_الملف_النسبي_2": "محتوى الكود البرمجي بالكامل هنا"
        }}
        لا تكتب أي كلام آخر خارج الـ JSON لتجنب تخريب السكربت.
        """
        
        response_text = ask_gemini(prompt)
        
        try:
            # تنظيف الرد لاستخراج الـ JSON
            if "```json" in response_text:
                response_text = response_text.split("```json")[-1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[-1].split("```")[0].strip()
                
            files_dict = json.loads(response_text.strip())
            print("\n⚙️ جاري دمج وحفظ الملفات في المجلد المطلوب وتحديث المشروع...")
            
            for rel_path, file_content in files_dict.items():
                safe_write_file(output_dir, rel_path, file_content)
                
            print(f"\n🎉 نجاح باهر! تم دمج الكود وربط الأزرار والوظائف تلقائياً وبأمان كامل في {output_dir}")
            break
        except Exception as e:
            print("\n🤖 حدث خطأ أثناء تحليل الـ JSON تلقائياً. إليك مخرجات الكود مباشرة لنسخها يدوياً:")
            print(response_text)
            break
