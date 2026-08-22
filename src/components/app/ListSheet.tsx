import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { Mascot } from "@/components/app/Screen";
import { useStudy } from "@/state/StudyStore";

const taskTones = ["bg-task-green", "bg-task-sky", "bg-task-peach"];

export function ListSheet({ date, onClose }: { date: string; onClose: () => void }) {
  const { templates, addTemplate, removeTemplate, setTemplateOnDate, isTemplateOn, canManage } =
    useStudy();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addTemplate(date, text);
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30"
      />
      <div
        className="relative w-full max-w-[420px] rounded-t-[20px] bg-background px-5 pt-5 shadow-soft"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground">리스트 관리</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <Mascot kind="hello" size={64} />
          <div>
            <p className="text-lg font-extrabold text-foreground">조금씩 해도 충분해!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              체크하면 그 날짜 할 일에 바로 나타나요
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mb-4"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="할 일을 입력하세요"
            className="w-full rounded-[20px] bg-surface px-4 py-4 text-lg text-foreground shadow-soft outline-none placeholder:text-muted-foreground"
          />
        </form>

        <ul className="max-h-[40vh] space-y-3 overflow-y-auto pb-1">
          {templates.map((tpl, i) => {
            const on = isTemplateOn(date, tpl.id);
            return (
              <li
                key={tpl.id}
                className={`flex items-center gap-4 rounded-[20px] px-4 py-4 shadow-soft ${taskTones[i % taskTones.length]}`}
              >
                <button
                  type="button"
                  aria-label={on ? `${tpl.title} 이 날짜에서 빼기` : `${tpl.title} 이 날짜에 넣기`}
                  onClick={() => setTemplateOnDate(date, tpl.id, !on)}
                  disabled={!canManage(date)}
                  className={`flex size-7 items-center justify-center rounded-md ${on ? "bg-check" : "bg-surface"}`}
                >
                  {on && <Check size={18} strokeWidth={3} className="text-surface" />}
                </button>
                <span className="flex-1 text-lg font-semibold text-foreground">{tpl.title}</span>
                <button
                  type="button"
                  aria-label={`${tpl.title} 삭제`}
                  onClick={() => removeTemplate(date, tpl.id)}
                  className="p-1 text-muted-foreground"
                >
                  <Trash2 size={20} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
