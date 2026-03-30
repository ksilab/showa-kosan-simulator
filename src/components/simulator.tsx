"use client"

import { useState, useEffect } from "react"
import { MapPin, ChevronRight, ChevronLeft, MessageCircle, RotateCcw } from "lucide-react"
import rosenkaData from "@/data/rosenka.json"

// --- 定数 ---
const CONSTANTS = {
  LAND_ADJUSTMENT_FACTOR: 0.75,
  BUILDING_UNIT_PRICE: { 木造: 200_000, 軽量鉄骨: 250_000, RC: 300_000 } as Record<string, number>,
  USEFUL_LIFE: { 木造: 22, 軽量鉄骨: 27, RC: 47 } as Record<string, number>,
  PRICE_RANGE_PERCENTAGE: 0.1,
  LINE_ID: "showa-kosan",
}

// rosenkaDataから市区町村リストを生成
type CityEntry = { code: string; name: string; areas: Record<string, number> }
const CITIES: CityEntry[] = Object.entries(rosenkaData)
  .filter(([k]) => k !== "metadata")
  .map(([code, val]) => ({ code, ...(val as { name: string; areas: Record<string, number> }) }))

function formatYen(val: number): string {
  if (val >= 100_000_000) return (val / 100_000_000).toFixed(1) + "億円"
  if (val >= 10_000) return Math.round(val / 10_000) + "万円"
  return val.toLocaleString() + "円"
}

type Structure = "木造" | "軽量鉄骨" | "RC"

interface Result {
  total: number
  rangeLow: number
  rangeHigh: number
  landPrice: number
  buildingPrice: number
  landPct: number
  buildPct: number
  rosenka: number
  structure: Structure
  age: number
  landArea: number
  effectiveRatio: number
}

const SELECT_CLASS = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"

// --- Step 1: 住所入力（構造化フォーム） ---
function Step1({
  onNext,
}: {
  onNext: (address: string, rosenka: number) => void
}) {
  const [cityCode, setCityCode] = useState("")
  const [area, setArea] = useState("")
  const [banchi, setBanchi] = useState("")
  const [isOutOfArea, setIsOutOfArea] = useState(false)
  const [isAreaNotListed, setIsAreaNotListed] = useState(false)
  const [showWhyModal, setShowWhyModal] = useState(false)

  const selectedCity = CITIES.find((c) => c.code === cityCode)
  const areas = selectedCity ? Object.keys(selectedCity.areas) : []

  function handleCityChange(code: string) {
    setCityCode(code)
    setArea("")
    setIsOutOfArea(code === "other")
    setIsAreaNotListed(false)
  }

  function handleAreaChange(val: string) {
    setArea(val)
    setIsAreaNotListed(val === "not_listed")
  }

  function handleNext() {
    if (!selectedCity || !area) return
    const rosenka = selectedCity.areas[area]
    const address = `群馬県${selectedCity.name}${area}${banchi}`
    onNext(address, rosenka)
  }

  const lineMsg = encodeURIComponent(`【対応エリア外・査定のご相談】\n査定のご依頼をしたいです。`)

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">物件の住所を入力</h2>
      <p className="text-xs text-gray-400 mb-4">※ このアプリの対応エリアでない場合はLINEにてご案内します。</p>

      {/* 市区町村 */}
      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">市区町村</label>
        <select value={cityCode} onChange={(e) => handleCityChange(e.target.value)} className={SELECT_CLASS}>
          <option value="">選択してください</option>
          {CITIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
          <option value="other">その他（上記以外）</option>
        </select>
      </div>

      {isOutOfArea ? (
        <div className="space-y-2 mt-4">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <p className="text-xs text-amber-700">
              選択されたエリアはシミュレーター対象外です。<br />LINEにてご相談ください。
            </p>
          </div>
          <a
            href={`https://line.me/R/oaMessage/${CONSTANTS.LINE_ID}/?${lineMsg}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition shadow-sm"
          >
            <MessageCircle className="size-4" />
            LINEで相談する
          </a>
        </div>
      ) : (
        <>
          {/* 字 */}
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">字・町名</label>
            <select
              value={area}
              onChange={(e) => handleAreaChange(e.target.value)}
              disabled={!cityCode}
              className={SELECT_CLASS}
            >
              <option value="">選択してください</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
              {cityCode && <option value="not_listed">上記にない</option>}
            </select>
          </div>

          {isAreaNotListed ? (
            <div className="space-y-2 mt-1">
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs text-amber-700">
                    該当の字・町名がリストにない場合は、LINEにてご相談ください。
                  </p>
                  <button
                    onClick={() => setShowWhyModal(true)}
                    className="mt-1 text-xs text-amber-600 underline"
                  >
                    なんで？
                  </button>
                </div>
              </div>
              <a
                href={`https://line.me/R/oaMessage/${CONSTANTS.LINE_ID}/?${encodeURIComponent(`【査定のご相談】\n市区町村：${selectedCity?.name ?? ""}\n字・町名がリストにないためご相談したいです。`)}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition shadow-sm"
              >
                <MessageCircle className="size-4" />
                LINEで相談する
              </a>

              {/* なんで？モーダル */}
              {showWhyModal && (
                <div
                  className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
                  onClick={() => setShowWhyModal(false)}
                >
                  <div
                    className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-base font-bold text-gray-800 mb-3">このアプリについて</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      このシミュレーターは、<span className="font-semibold">国税庁が公表する路線価データ</span>をもとに土地の評価額を算出しています。
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      路線価は道路ごとに設定されており、すべての字・町名のデータを網羅するには膨大な情報量が必要です。そのため、現在は主要エリアのみ対応しています。
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      リストにないエリアでも、<span className="font-semibold">LINEでのご相談であれば正式な査定が可能</span>です。お気軽にご連絡ください。
                    </p>
                    <button
                      onClick={() => setShowWhyModal(false)}
                      className="mt-5 w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 番地 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  番地 <span className="text-gray-400 font-normal">（任意）</span>
                </label>
                <input
                  type="text"
                  value={banchi}
                  onChange={(e) => setBanchi(e.target.value)}
                  placeholder="例：123-4"
                  className={SELECT_CLASS}
                />
              </div>

              <button
                disabled={!cityCode || !area}
                onClick={handleNext}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition flex items-center justify-center gap-1"
              >
                次へ <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

// --- Step 2: 物件スペック ---
function Step2({
  onNext,
  onBack,
}: {
  onNext: (landArea: number, buildingArea: number, age: number, structure: Structure) => void
  onBack: () => void
}) {
  const [landArea, setLandArea] = useState("")
  const [buildingArea, setBuildingArea] = useState("")
  const [age, setAge] = useState("")
  const [structure, setStructure] = useState<Structure>("木造")
  const [error, setError] = useState(false)
  const [showStructureModal, setShowStructureModal] = useState(false)

  function handleCalculate() {
    const la = parseFloat(landArea)
    const ba = parseFloat(buildingArea)
    const ag = parseFloat(age)
    if (!la || !ba || isNaN(ag)) {
      setError(true)
      return
    }
    setError(false)
    onNext(la, ba, ag, structure)
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">物件のスペックを入力</h2>
      <p className="text-xs text-gray-500 mb-4">「わからない」を選ぶと地域の標準値で計算します</p>

      {/* 土地面積 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">土地面積</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={landArea}
            onChange={(e) => setLandArea(e.target.value)}
            placeholder="例：150"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="flex items-center text-sm text-gray-500">㎡</span>
        </div>
        <button
          onClick={() => setLandArea("165")}
          className="mt-1 text-xs text-blue-400 underline"
        >
          わからない（標準値 165㎡を使う）
        </button>
      </div>

      {/* 建物面積 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">建物面積</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={buildingArea}
            onChange={(e) => setBuildingArea(e.target.value)}
            placeholder="例：100"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="flex items-center text-sm text-gray-500">㎡</span>
        </div>
        <button
          onClick={() => setBuildingArea("100")}
          className="mt-1 text-xs text-blue-400 underline"
        >
          わからない（標準値 100㎡を使う）
        </button>
      </div>

      {/* 築年数 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">築年数</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例：20"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="flex items-center text-sm text-gray-500">年</span>
        </div>
        <button
          onClick={() => setAge("15")}
          className="mt-1 text-xs text-blue-400 underline"
        >
          わからない（標準値 15年を使う）
        </button>
      </div>

      {/* 構造 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">構造</label>
          <button
            onClick={() => setShowStructureModal(true)}
            className="text-xs text-blue-400 underline"
          >
            構造のみかた →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["木造", "軽量鉄骨", "RC"] as Structure[]).map((s) => (
            <button
              key={s}
              onClick={() => setStructure(s)}
              className={`py-2 rounded-xl border text-sm transition ${
                structure === s
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                  : "border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {s === "RC" ? "鉄筋コンクリート造" : s === "軽量鉄骨" ? "鉄骨造" : s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">※ わからない場合は「木造」を選択してください</p>
      </div>

      {/* 構造モーダル */}
      {showStructureModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowStructureModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-800 mb-4">構造のみかた</h3>
            <div className="space-y-3">
              {[
                {
                  label: "木造",
                  desc: "一般的な一戸建て住宅。柱・梁が木材でできています。",
                  hint: "築年数が古い一戸建てのほとんどが木造です。",
                },
                {
                  label: "鉄骨造",
                  desc: "積水ハウス・ダイワハウス・パナソニックホームズなどのハウスメーカー系。",
                  hint: "プレハブ住宅・軽量鉄骨・重量鉄骨が含まれます。",
                },
                {
                  label: "鉄筋コンクリート造",
                  desc: "マンション・団地・学校などの建物。一戸建てでは少数です。",
                  hint: "コンクリート打ちっぱなしや外壁がモルタルの建物が多いです。",
                },
              ].map(({ label, desc, hint }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{label}</p>
                  <p className="text-xs text-gray-600">{desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">わからない場合は「木造」を選択してください</p>
            <button
              onClick={() => setShowStructureModal(false)}
              className="mt-4 w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center mb-3">
          土地面積・建物面積・築年数を入力してください
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1"
        >
          <ChevronLeft className="size-4" /> 戻る
        </button>
        <button
          onClick={handleCalculate}
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition"
        >
          査定する
        </button>
      </div>
    </div>
  )
}

// --- Step 3: 結果 ---
function Step3({
  address,
  result,
  onReset,
}: {
  address: string
  result: Result
  onReset: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const lineMsg = encodeURIComponent(
    `【査定シミュレーター結果】\n住所：${address}\n概算：${formatYen(result.total)}（${formatYen(result.rangeLow)}〜${formatYen(result.rangeHigh)}）\n（土地：${formatYen(result.landPrice)} / 建物：${formatYen(result.buildingPrice)}）\n正式査定をお願いしたいです。`
  )
  const lineUrl = `https://line.me/R/oaMessage/${CONSTANTS.LINE_ID}/?${lineMsg}`

  return (
    <div>
      <div className="text-center mb-5">
        <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
          <MapPin className="size-3" />
          <span className="text-gray-500">{address}</span>
        </p>
        <p className="text-sm text-gray-500 mb-1">概算査定額</p>
        <p className="text-3xl font-bold text-blue-600">{formatYen(result.total)}</p>
        <p className="text-sm text-gray-400 mt-1">
          {formatYen(result.rangeLow)} 〜 {formatYen(result.rangeHigh)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">（路線価ベース・参考値）</p>
      </div>

      {/* 内訳 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">🌍 土地評価額</span>
            <span className="font-semibold text-gray-800">{formatYen(result.landPrice)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-400 rounded-full transition-all duration-1000"
              style={{ width: mounted ? `${result.landPct}%` : "0%" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            路線価 {result.rosenka.toLocaleString()}円/㎡ ÷ 0.75 × {result.landArea}㎡
          </p>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">🏠 建物評価額</span>
            <span className="font-semibold text-gray-800">{formatYen(result.buildingPrice)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-400 rounded-full transition-all duration-1000"
              style={{ width: mounted ? `${result.buildPct}%` : "0%" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {result.structure}・築{result.age}年・残存率{Math.round(result.effectiveRatio * 100)}%
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mb-5">
        ※ 本結果は参考値であり、正式査定ではありません。<br />
        実際の査定額は現地確認後に確定します。
      </p>

      <a
        href={lineUrl}
        className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition shadow-md"
      >
        <MessageCircle className="size-4" />
        この査定結果をLINEで相談する
      </a>
      <button
        onClick={onReset}
        className="w-full mt-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1"
      >
        <RotateCcw className="size-3.5" /> もう一度やり直す
      </button>
    </div>
  )
}

// --- メインコンポーネント ---
export default function Simulator() {
  const [step, setStep] = useState(1)
  const [address, setAddress] = useState("")
  const [rosenka, setRosenka] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  const stepLabels = ["住所入力", "物件スペック", "査定結果"]
  const progressWidth = step === 3 ? "100%" : `${step * 33.3}%`

  function handleStep1(addr: string, r: number) {
    setAddress(addr)
    setRosenka(r)
    setStep(2)
  }

  function handleStep2(landArea: number, buildingArea: number, age: number, structure: Structure) {
    const usefulLife = CONSTANTS.USEFUL_LIFE[structure]
    const unitPrice = CONSTANTS.BUILDING_UNIT_PRICE[structure]

    const landPrice = (rosenka / CONSTANTS.LAND_ADJUSTMENT_FACTOR) * landArea

    const ratio = Math.max(0, 1 - age / usefulLife)
    const effectiveRatio = ratio
    const buildingPrice = unitPrice * buildingArea * effectiveRatio

    const total = landPrice + buildingPrice
    const rangeLow = Math.round((total * (1 - CONSTANTS.PRICE_RANGE_PERCENTAGE)) / 10_000) * 10_000
    const rangeHigh = Math.round((total * (1 + CONSTANTS.PRICE_RANGE_PERCENTAGE)) / 10_000) * 10_000
    const landPct = Math.round((landPrice / total) * 100)
    const buildPct = Math.round((buildingPrice / total) * 100)

    setResult({ total, rangeLow, rangeHigh, landPrice, buildingPrice, landPct, buildPct, rosenka, structure, age, landArea, effectiveRatio })
    setStep(3)
  }

  function handleReset() {
    setStep(1)
    setAddress("")
    setRosenka(0)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      {/* ヘッダー */}
      <div className="w-full max-w-md mb-6 text-center">
        <p className="text-xs text-gray-400 mb-1">昭和興産｜無料サービス</p>
        <h1 className="text-xl font-bold text-gray-800">🏠 不動産 簡易査定</h1>
        <p className="text-xs text-gray-500 mt-1">約1分で、あなたの土地・建物の目安額がわかります</p>
      </div>

      {/* プログレスバー */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Step {step} / 3</span>
          <span>{stepLabels[step - 1]}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* カード */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        {step === 1 && <Step1 onNext={(addr, r) => handleStep1(addr, r)} />}
        {step === 2 && <Step2 onNext={handleStep2} onBack={() => setStep(1)} />}
        {step === 3 && result && <Step3 address={address} result={result} onReset={handleReset} />}
      </div>

      {/* フッター */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        © 昭和興産株式会社　|　本ツールは概算参考値を提供するものです
      </p>
    </div>
  )
}
