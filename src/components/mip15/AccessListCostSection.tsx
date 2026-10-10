"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const ADDRESS_BYTES = 20;
const KEY_BYTES = 32;
const MONAD_GAS_PER_BYTE = 40; // MIP-15: matches Monad's calldata floor
const ETH_GAS_PER_BYTE = 64; // EIP-7981 as specified for Ethereum

export function surcharge(addresses: number, keys: number, gasPerByte: number) {
  return (addresses * ADDRESS_BYTES + keys * KEY_BYTES) * gasPerByte;
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between font-mono text-xs text-text-secondary mb-2">
        <span>{label}</span>
        <span className="tabular-nums text-text-primary font-semibold">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-solution-accent"
      />
    </label>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function AccessListCostSection() {
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState(2);
  const [keys, setKeys] = useState(12);
  const [pages, setPages] = useState(3);
  const pageCount = Math.min(pages, keys);

  const monad = surcharge(addresses, keys, MONAD_GAS_PER_BYTE);
  const eth = surcharge(addresses, keys, ETH_GAS_PER_BYTE);
  const monadPerPage = surcharge(addresses, pageCount, MONAD_GAS_PER_BYTE);

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip15.accessList.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip15.accessList.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-6">
            <Slider
              label={t("mip15.accessList.addresses")}
              value={addresses}
              min={0}
              max={10}
              onChange={setAddresses}
            />
            <Slider
              label={t("mip15.accessList.keys")}
              value={keys}
              min={0}
              max={64}
              onChange={(v) => {
                setKeys(v);
                if (pages > v) setPages(v);
              }}
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-solution-bg border border-solution-accent/20 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-solution-accent mb-1">
                  {t("mip15.accessList.monad")}
                </p>
                <p className="font-mono text-2xl font-semibold tabular-nums text-solution-accent">
                  {fmt(monad)}
                </p>
                <p className="font-mono text-[10px] text-text-tertiary">
                  {t("mip15.accessList.gas")}
                </p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary mb-1">
                  {t("mip15.accessList.ethereum")}
                </p>
                <p className="font-mono text-2xl font-light tabular-nums text-text-secondary">
                  {fmt(eth)}
                </p>
                <p className="font-mono text-[10px] text-text-tertiary">
                  {t("mip15.accessList.gas")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">
              {t("mip15.accessList.mip8Title")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              {t("mip15.accessList.mip8Body")}
            </p>
            <Slider
              label={t("mip15.accessList.pages")}
              value={pageCount}
              min={keys === 0 ? 0 : 1}
              max={keys}
              onChange={setPages}
            />
            <div className="mt-6 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">
                  {t("mip15.accessList.everyKey")} ({keys})
                </span>
                <span className="tabular-nums text-text-secondary">
                  {fmt(monad)} {t("mip15.accessList.gas")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">
                  {t("mip15.accessList.onePerPage")} ({pageCount})
                </span>
                <span className="tabular-nums text-solution-accent font-semibold">
                  {fmt(monadPerPage)} {t("mip15.accessList.gas")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="font-mono text-[11px] text-text-tertiary text-center mt-6">
          {t("mip15.accessList.note")}
        </p>
      </div>
    </section>
  );
}
