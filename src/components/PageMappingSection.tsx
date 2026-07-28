"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";

export default function PageMappingSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [slotInput, setSlotInput] = useState(0);

  const pageIndex = slotInput >> 7;
  const offset = slotInput & 0x7f;

  // Show slots 0-511 (4 pages worth)
  const PAGE_SIZE = 128;
  const VISIBLE_PAGES = 4;
  const slots = Array.from(
    { length: PAGE_SIZE * VISIBLE_PAGES },
    (_, i) => i
  );

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-elevated relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip8.pageMapping.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-2xl leading-relaxed mb-10">
          {t("mip8.pageMapping.desc")}
        </p>

        {/* Slider input */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
            <div className="flex-1">
              <label htmlFor="slot-range" className="font-mono text-xs text-text-tertiary block mb-2">
                {t("mip8.pageMapping.storageSlot")}
              </label>
              <input
                id="slot-range"
                type="range"
                min={0}
                max={511}
                value={slotInput}
                onChange={(e) => setSlotInput(Number(e.target.value))}
                aria-valuetext={`slot ${slotInput}, page ${pageIndex}, offset ${offset}`}
                className="w-full accent-solution-accent cursor-pointer"
              />
              <div className="flex justify-between font-mono text-xs text-text-tertiary mt-1">
                <span>0</span>
                <span>127</span>
                <span>255</span>
                <span>383</span>
                <span>511</span>
              </div>
            </div>
            <div className="font-mono text-right sm:text-left">
              <input
                type="number"
                min={0}
                max={511}
                value={slotInput}
                onChange={(e) =>
                  setSlotInput(
                    Math.max(0, Math.min(511, Number(e.target.value)))
                  )
                }
                aria-label={t("mip8.pageMapping.storageSlot")}
                className="w-24 px-3 py-2 rounded-md border border-border bg-surface text-right font-mono text-lg tabular-nums focus:outline-none focus:border-solution-accent"
              />
            </div>
          </div>

          {/* Formula display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-solution-bg border border-solution-accent-light">
              <p className="font-mono text-xs text-text-tertiary mb-1">
                page_index(slot) = slot &gt;&gt; 7
              </p>
              <p className="font-mono text-2xl font-semibold text-solution-accent tabular-nums">
                {slotInput} &gt;&gt; 7 ={" "}
                <motion.span
                  key={pageIndex}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                >
                  {pageIndex}
                </motion.span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-solution-bg border border-solution-accent-light">
              <p className="font-mono text-xs text-text-tertiary mb-1">
                offset(slot) = slot &amp; 0x7F
              </p>
              <p className="font-mono text-2xl font-semibold text-solution-accent tabular-nums">
                {slotInput} &amp; 127 ={" "}
                <motion.span
                  key={offset}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                >
                  {offset}
                </motion.span>
              </p>
            </div>
          </div>
        </div>

        {/* Visual slot map */}
        <div className="bg-surface-elevated rounded-xl border border-border p-4 overflow-x-auto">
          <div className="flex gap-3 min-w-[600px]">
            {Array.from({ length: VISIBLE_PAGES }, (_, pageIdx) => (
              <div key={pageIdx} className="flex-1">
                <p
                  className={`font-mono text-xs mb-1 ${
                    pageIdx === pageIndex
                      ? "text-solution-accent font-semibold"
                      : "text-text-tertiary"
                  }`}
                >
                  {t("mip8.pageMapping.page")} {pageIdx}
                </p>
                <div
                  className={`rounded-lg p-1.5 border transition-all duration-300 ${
                    pageIdx === pageIndex
                      ? "border-solution-accent bg-solution-bg"
                      : "border-border"
                  }`}
                >
                  <div
                    className="grid gap-[1px]"
                    style={{
                      gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
                    }}
                  >
                    {slots
                      .slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
                      .map((slot) => {
                        const isActive = slot === slotInput;
                        const isOnPage = pageIdx === pageIndex;
                        return (
                          <div
                            key={slot}
                            className={`w-full aspect-square rounded-[1px] transition-colors duration-200 ${
                              isActive
                                ? "bg-solution-accent"
                                : isOnPage
                                ? "bg-solution-accent-light"
                                : "bg-problem-cell"
                            }`}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
