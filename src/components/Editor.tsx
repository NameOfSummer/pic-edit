import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  ClipboardPaste,
  Crop,
  Trash2,
} from "lucide-react";
import { ArrowView } from "@/components/ArrowView";
import { CounterView } from "@/components/CounterView";
import { LayerImage } from "@/components/LayerImage";
import { MarkerView } from "@/components/MarkerView";
import { MosaicView } from "@/components/MosaicView";
import { RectView } from "@/components/RectView";
import { SelectionChrome } from "@/components/SelectionChrome";
import { TextView } from "@/components/TextView";
import { Toolbar } from "@/components/Toolbar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { collectClipboardImages, collectClipboardImagesFromEvent, collectImageFiles } from "@/editor/images";
import {
  omitAnnotationId,
  shiftAnnotationClipboard,
  type AnnotationClipboard,
} from "@/editor/annotationClipboard";
import { copyLayersAsPng, downloadLayersAsPng } from "@/editor/export";
import { createHistoryController, type EditorSnapshot } from "@/editor/history";
import { normalizeRectFromDrag } from "@/editor/rectGeometry";
import { useArrows } from "@/editor/useArrows";
import { useCounters } from "@/editor/useCounters";
import { useLayers } from "@/editor/useLayers";
import { useMarkers } from "@/editor/useMarkers";
import { useMosaics } from "@/editor/useMosaics";
import { useRects } from "@/editor/useRects";
import { useTexts } from "@/editor/useTexts";
import {
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_STROKE,
  DEFAULT_COUNTER_COLOR,
  DEFAULT_COUNTER_SIZE,
  DEFAULT_MARKER_COLOR,
  DEFAULT_MARKER_STROKE,
  DEFAULT_MOSAIC_BLOCK,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_WEIGHT,
  type AnnotationStyle,
  type CounterStyle,
  type CropRect,
  type EditorTool,
  type MarkerStyle,
  type MosaicStyle,
  type Point,
  type TextStyle,
} from "@/editor/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ContextTarget = "canvas" | "layer" | "arrow" | "rect" | "text" | "counter" | "mosaic" | "marker";
type DraftLine = { x1: number; y1: number; x2: number; y2: number };

export function Editor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const contextPointRef = useRef<Point>({ x: 0, y: 0 });
  const draftRef = useRef<{ pointerId: number; x1: number; y1: number } | null>(null);
  const annotationClipboardRef = useRef<AnnotationClipboard | null>(null);
  const historyRef = useRef(createHistoryController());
  const gestureRef = useRef(false);
  const [historyTick, setHistoryTick] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [contextTarget, setContextTarget] = useState<ContextTarget>("canvas");
  const [canPasteImage, setCanPasteImage] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tool, setTool] = useState<EditorTool>("select");
  const [draftArrow, setDraftArrow] = useState<DraftLine | null>(null);
  const [draftRect, setDraftRect] = useState<DraftLine | null>(null);
  const [draftMosaic, setDraftMosaic] = useState<DraftLine | null>(null);
  const [draftMarker, setDraftMarker] = useState<DraftLine | null>(null);
  const [annotationStyle, setAnnotationStyle] = useState<AnnotationStyle>({
    color: DEFAULT_ANNOTATION_COLOR,
    strokeWidth: DEFAULT_ANNOTATION_STROKE,
  });
  const [textStyle, setTextStyle] = useState<TextStyle>({
    color: DEFAULT_TEXT_COLOR,
    fontSize: DEFAULT_TEXT_SIZE,
    fontWeight: DEFAULT_TEXT_WEIGHT,
  });
  const [counterStyle, setCounterStyle] = useState<CounterStyle>({
    color: DEFAULT_COUNTER_COLOR,
    size: DEFAULT_COUNTER_SIZE,
  });
  const [mosaicStyle, setMosaicStyle] = useState<MosaicStyle>({
    blockSize: DEFAULT_MOSAIC_BLOCK,
  });
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle>({
    color: DEFAULT_MARKER_COLOR,
    strokeWidth: DEFAULT_MARKER_STROKE,
  });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const {
    layers,
    selectedId,
    setSelectedId,
    selectLayer,
    addFiles,
    updateLayer,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    removeSelected,
    applyCrop,
    replaceAll: replaceAllLayers,
    clearAll: clearAllLayers,
  } = useLayers();

  const {
    arrows,
    selectedArrowId,
    setSelectedArrowId,
    addArrow,
    insertArrow,
    updateArrow,
    removeSelectedArrow,
    clearArrowSelection,
    replaceAll: replaceAllArrows,
    clearAll: clearAllArrows,
  } = useArrows();

  const {
    rects,
    selectedRectId,
    setSelectedRectId,
    addRect,
    insertRect,
    updateRect,
    removeSelectedRect,
    clearRectSelection,
    replaceAll: replaceAllRects,
    clearAll: clearAllRects,
  } = useRects();

  const {
    texts,
    selectedTextId,
    setSelectedTextId,
    addText,
    insertText,
    updateText,
    removeSelectedText,
    clearTextSelection,
    replaceAll: replaceAllTexts,
    clearAll: clearAllTexts,
  } = useTexts();

  const {
    counters,
    selectedCounterId,
    setSelectedCounterId,
    addCounter,
    insertCounter,
    updateCounter,
    removeSelectedCounter,
    clearCounterSelection,
    replaceAll: replaceAllCounters,
    clearAll: clearAllCounters,
  } = useCounters();

  const {
    mosaics,
    selectedMosaicId,
    setSelectedMosaicId,
    addMosaic,
    insertMosaic,
    updateMosaic,
    removeSelectedMosaic,
    clearMosaicSelection,
    replaceAll: replaceAllMosaics,
    clearAll: clearAllMosaics,
  } = useMosaics();

  const {
    markers,
    selectedMarkerId,
    setSelectedMarkerId,
    addMarker,
    insertMarker,
    updateMarker,
    removeSelectedMarker,
    clearMarkerSelection,
    replaceAll: replaceAllMarkers,
    clearAll: clearAllMarkers,
  } = useMarkers();

  const docRef = useRef({ layers, arrows, rects, texts, counters, mosaics, markers });
  docRef.current = { layers, arrows, rects, texts, counters, mosaics, markers };

  const selectedLayer = layers.find((layer) => layer.id === selectedId) ?? null;
  const selectedArrow = arrows.find((arrow) => arrow.id === selectedArrowId) ?? null;
  const selectedRect = rects.find((rect) => rect.id === selectedRectId) ?? null;
  const selectedText = texts.find((text) => text.id === selectedTextId) ?? null;
  const selectedCounter = counters.find((counter) => counter.id === selectedCounterId) ?? null;
  const selectedMosaic = mosaics.find((mosaic) => mosaic.id === selectedMosaicId) ?? null;
  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const selectedIndex = selectedId ? layers.findIndex((layer) => layer.id === selectedId) : -1;
  const showLayerOrder = contextTarget === "layer" && Boolean(selectedId);
  const showArrowMenu = contextTarget === "arrow" && Boolean(selectedArrowId);
  const showRectMenu = contextTarget === "rect" && Boolean(selectedRectId);
  const showTextMenu = contextTarget === "text" && Boolean(selectedTextId);
  const showCounterMenu = contextTarget === "counter" && Boolean(selectedCounterId);
  const showMosaicMenu = contextTarget === "mosaic" && Boolean(selectedMosaicId);
  const showMarkerMenu = contextTarget === "marker" && Boolean(selectedMarkerId);
  const showStrokeStyle =
    tool === "arrow" || tool === "rect" || Boolean(selectedArrow) || Boolean(selectedRect);
  const showTextStyle = tool === "text" || Boolean(selectedText);
  const showCounterStyle = tool === "counter" || Boolean(selectedCounter);
  const showMosaicStyle = tool === "mosaic" || Boolean(selectedMosaic);
  const showMarkerStyle = tool === "marker" || Boolean(selectedMarker);
  const activeAnnotationStyle: AnnotationStyle = selectedArrow
    ? { color: selectedArrow.color, strokeWidth: selectedArrow.strokeWidth }
    : selectedRect
      ? { color: selectedRect.color, strokeWidth: selectedRect.strokeWidth }
      : annotationStyle;
  const activeTextStyle: TextStyle = selectedText
    ? {
        color: selectedText.color,
        fontSize: selectedText.fontSize,
        fontWeight: selectedText.fontWeight,
      }
    : textStyle;
  const activeCounterStyle: CounterStyle = selectedCounter
    ? { color: selectedCounter.color, size: selectedCounter.size }
    : counterStyle;
  const activeMosaicStyle: MosaicStyle = selectedMosaic
    ? { blockSize: selectedMosaic.blockSize }
    : mosaicStyle;
  const activeMarkerStyle: MarkerStyle = selectedMarker
    ? { color: selectedMarker.color, strokeWidth: selectedMarker.strokeWidth }
    : markerStyle;
  const annotationStyleLabel =
    tool === "rect" || selectedRect ? "枠" : tool === "arrow" || selectedArrow ? "矢印" : "注釈";
  const canBringForward = selectedIndex >= 0 && selectedIndex < layers.length - 1;
  const canSendBackward = selectedIndex > 0;
  const canBringToFront = canBringForward;
  const canSendToBack = canSendBackward;
  const canExport =
    layers.length > 0 ||
    arrows.length > 0 ||
    rects.length > 0 ||
    texts.length > 0 ||
    counters.length > 0 ||
    mosaics.length > 0 ||
    markers.length > 0;
  const canReset = canExport;
  const canUndo = historyTick >= 0 && historyRef.current.canUndo();
  const canRedo = historyTick >= 0 && historyRef.current.canRedo();
  const isDrawingTool = tool === "arrow" || tool === "rect" || tool === "mosaic" || tool === "marker";
  const isTextTool = tool === "text";
  const isCounterTool = tool === "counter";

  const takeSnapshot = useCallback((): EditorSnapshot => {
    const doc = docRef.current;
    return {
      layers: doc.layers.map((item) => ({ ...item })),
      arrows: doc.arrows.map((item) => ({ ...item })),
      rects: doc.rects.map((item) => ({ ...item })),
      texts: doc.texts.map((item) => ({ ...item })),
      counters: doc.counters.map((item) => ({ ...item })),
      mosaics: doc.mosaics.map((item) => ({ ...item })),
      markers: doc.markers.map((item) => ({ ...item })),
    };
  }, []);

  const pushHistory = useCallback(() => {
    historyRef.current.push(takeSnapshot());
    setHistoryTick((tick) => tick + 1);
  }, [takeSnapshot]);

  const beginGesture = useCallback(() => {
    if (!gestureRef.current) {
      pushHistory();
      gestureRef.current = true;
    }
  }, [pushHistory]);

  const exitCrop = useCallback(() => {
    setCropping(false);
    setCrop(null);
  }, []);

  const clearLayerSelection = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  const clearAllSelections = useCallback(() => {
    clearLayerSelection();
    clearArrowSelection();
    clearRectSelection();
    clearTextSelection();
    clearCounterSelection();
    clearMosaicSelection();
    clearMarkerSelection();
    setEditingTextId(null);
  }, [
    clearArrowSelection,
    clearCounterSelection,
    clearLayerSelection,
    clearMarkerSelection,
    clearMosaicSelection,
    clearRectSelection,
    clearTextSelection,
  ]);

  const applySnapshot = useCallback(
    (snapshot: EditorSnapshot) => {
      replaceAllLayers(snapshot.layers);
      replaceAllArrows(snapshot.arrows);
      replaceAllRects(snapshot.rects);
      replaceAllTexts(snapshot.texts);
      replaceAllCounters(snapshot.counters);
      replaceAllMosaics(snapshot.mosaics);
      replaceAllMarkers(snapshot.markers ?? []);
      clearAllSelections();
      setEditingTextId(null);
      exitCrop();
    },
    [
      clearAllSelections,
      exitCrop,
      replaceAllArrows,
      replaceAllCounters,
      replaceAllLayers,
      replaceAllMarkers,
      replaceAllMosaics,
      replaceAllRects,
      replaceAllTexts,
    ],
  );

  const undo = useCallback(() => {
    gestureRef.current = false;
    const snapshot = historyRef.current.undo(takeSnapshot());
    if (!snapshot) {
      return;
    }
    applySnapshot(snapshot);
    setHistoryTick((tick) => tick + 1);
  }, [applySnapshot, takeSnapshot]);

  const redo = useCallback(() => {
    gestureRef.current = false;
    const snapshot = historyRef.current.redo(takeSnapshot());
    if (!snapshot) {
      return;
    }
    applySnapshot(snapshot);
    setHistoryTick((tick) => tick + 1);
  }, [applySnapshot, takeSnapshot]);

  const reset = useCallback(() => {
    const doc = docRef.current;
    if (
      doc.layers.length === 0 &&
      doc.arrows.length === 0 &&
      doc.rects.length === 0 &&
      doc.texts.length === 0 &&
      doc.counters.length === 0 &&
      doc.mosaics.length === 0 &&
      doc.markers.length === 0
    ) {
      return;
    }
    clearAllLayers();
    clearAllArrows();
    clearAllRects();
    clearAllTexts();
    clearAllCounters();
    clearAllMosaics();
    clearAllMarkers();
    clearAllSelections();
    exitCrop();
    setTool("select");
    setDraftArrow(null);
    setDraftRect(null);
    setDraftMosaic(null);
    setDraftMarker(null);
    draftRef.current = null;
    gestureRef.current = false;
    historyRef.current.clear();
    setHistoryTick((tick) => tick + 1);
  }, [
    clearAllArrows,
    clearAllCounters,
    clearAllLayers,
    clearAllMarkers,
    clearAllMosaics,
    clearAllRects,
    clearAllSelections,
    clearAllTexts,
    exitCrop,
  ]);

  const placeFiles = useCallback(
    async (files: File[], origin?: Point) => {
      if (files.length === 0) {
        return;
      }
      pushHistory();
      exitCrop();
      setTool("select");
      clearArrowSelection();
      clearRectSelection();
      clearTextSelection();
      clearCounterSelection();
      clearMosaicSelection();
      clearMarkerSelection();
      setEditingTextId(null);
      await addFiles(files, origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    },
    [
      addFiles,
      clearArrowSelection,
      clearCounterSelection,
      clearMarkerSelection,
      clearMosaicSelection,
      clearRectSelection,
      clearTextSelection,
      exitCrop,
      pushHistory,
    ],
  );

  const pasteImagesAt = useCallback(
    async (origin: Point) => {
      const files = await collectClipboardImages(null);
      await placeFiles(files, origin);
    },
    [placeFiles],
  );

  const refreshCanPaste = useCallback(async () => {
    if (!navigator.clipboard?.read) {
      setCanPasteImage(true);
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      setCanPasteImage(items.some((item) => item.types.some((type) => type.startsWith("image/"))));
    } catch {
      setCanPasteImage(true);
    }
  }, []);

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    if (hasImagePayload(event.dataTransfer)) {
      setIsDragOver(true);
    }
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const onDrop = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    const files = collectImageFiles(event.dataTransfer.files);
    await placeFiles(files, { x: event.clientX, y: event.clientY });
  };

  const onPickFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = collectImageFiles(event.target.files);
    await placeFiles(files);
    event.target.value = "";
  };

  const startCrop = () => {
    if (!selectedLayer) {
      return;
    }
    setCrop({
      x: 0,
      y: 0,
      width: selectedLayer.width,
      height: selectedLayer.height,
    });
    setCropping(true);
    setTool("select");
  };

  const confirmCrop = useCallback(async () => {
    if (!crop) {
      return;
    }
    pushHistory();
    await applyCrop(crop);
    exitCrop();
  }, [applyCrop, crop, exitCrop, pushHistory]);

  const runExport = useCallback(
    async (action: "download" | "copy") => {
      if (!canExport || exporting) {
        return;
      }
      setExporting(true);
      try {
        if (action === "download") {
          await downloadLayersAsPng(layers, arrows, rects, texts, counters, mosaics, markers);
        } else {
          await copyLayersAsPng(layers, arrows, rects, texts, counters, mosaics, markers);
          toast.success("クリップボードにコピーしました", {
            duration: 1000,
            position: "top-right",
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "書き出しに失敗しました";
        toast.error(message, { position: "top-right" });
      } finally {
        setExporting(false);
      }
    },
    [arrows, canExport, counters, exporting, layers, markers, mosaics, rects, texts],
  );

  const onAnnotationStyleChange = useCallback(
    (patch: Partial<AnnotationStyle>) => {
      setAnnotationStyle((current) => ({ ...current, ...patch }));
      if (selectedArrowId) {
        pushHistory();
        updateArrow(selectedArrowId, patch);
      } else if (selectedRectId) {
        pushHistory();
        updateRect(selectedRectId, patch);
      }
    },
    [pushHistory, selectedArrowId, selectedRectId, updateArrow, updateRect],
  );

  const onTextStyleChange = useCallback(
    (patch: Partial<TextStyle>) => {
      setTextStyle((current) => ({ ...current, ...patch }));
      if (selectedTextId) {
        pushHistory();
        updateText(selectedTextId, patch);
      }
    },
    [pushHistory, selectedTextId, updateText],
  );

  const onCounterStyleChange = useCallback(
    (patch: Partial<CounterStyle>) => {
      setCounterStyle((current) => ({ ...current, ...patch }));
      if (selectedCounterId) {
        pushHistory();
        updateCounter(selectedCounterId, patch);
      }
    },
    [pushHistory, selectedCounterId, updateCounter],
  );

  const onMosaicStyleChange = useCallback(
    (patch: Partial<MosaicStyle>) => {
      setMosaicStyle((current) => ({ ...current, ...patch }));
      if (selectedMosaicId) {
        pushHistory();
        updateMosaic(selectedMosaicId, patch);
      }
    },
    [pushHistory, selectedMosaicId, updateMosaic],
  );

  const onMarkerStyleChange = useCallback(
    (patch: Partial<MarkerStyle>) => {
      setMarkerStyle((current) => ({ ...current, ...patch }));
      if (selectedMarkerId) {
        pushHistory();
        updateMarker(selectedMarkerId, patch);
      }
    },
    [pushHistory, selectedMarkerId, updateMarker],
  );

  const placeTextAt = useCallback(
    (origin: Point) => {
      pushHistory();
      clearLayerSelection();
      clearArrowSelection();
      clearRectSelection();
      clearCounterSelection();
      clearMosaicSelection();
      clearMarkerSelection();
      const id = addText(origin, textStyle);
      setTool("select");
      setEditingTextId(id);
    },
    [
      addText,
      clearArrowSelection,
      clearCounterSelection,
      clearLayerSelection,
      clearMarkerSelection,
      clearMosaicSelection,
      clearRectSelection,
      pushHistory,
      textStyle,
    ],
  );

  const placeCounterAt = useCallback(
    (origin: Point) => {
      pushHistory();
      clearLayerSelection();
      clearArrowSelection();
      clearRectSelection();
      clearTextSelection();
      clearMosaicSelection();
      clearMarkerSelection();
      setEditingTextId(null);
      addCounter(origin, counterStyle);
    },
    [
      addCounter,
      clearArrowSelection,
      clearLayerSelection,
      clearMarkerSelection,
      clearMosaicSelection,
      clearRectSelection,
      clearTextSelection,
      counterStyle,
      pushHistory,
    ],
  );

  const copySelectedAnnotation = useCallback((): boolean => {
    if (selectedArrow) {
      annotationClipboardRef.current = { kind: "arrow", data: omitAnnotationId(selectedArrow) };
      return true;
    }
    if (selectedRect) {
      annotationClipboardRef.current = { kind: "rect", data: omitAnnotationId(selectedRect) };
      return true;
    }
    if (selectedText) {
      annotationClipboardRef.current = { kind: "text", data: omitAnnotationId(selectedText) };
      return true;
    }
    if (selectedCounter) {
      annotationClipboardRef.current = { kind: "counter", data: omitAnnotationId(selectedCounter) };
      return true;
    }
    if (selectedMosaic) {
      annotationClipboardRef.current = { kind: "mosaic", data: omitAnnotationId(selectedMosaic) };
      return true;
    }
    if (selectedMarker) {
      annotationClipboardRef.current = { kind: "marker", data: omitAnnotationId(selectedMarker) };
      return true;
    }
    return false;
  }, [selectedArrow, selectedCounter, selectedMarker, selectedMosaic, selectedRect, selectedText]);

  const pasteAnnotationClipboard = useCallback((): boolean => {
    const clip = annotationClipboardRef.current;
    if (!clip) {
      return false;
    }
    const shifted = shiftAnnotationClipboard(clip);
    annotationClipboardRef.current = shifted;
    pushHistory();
    setTool("select");
    setEditingTextId(null);
    clearLayerSelection();
    clearArrowSelection();
    clearRectSelection();
    clearTextSelection();
    clearCounterSelection();
    clearMosaicSelection();
    clearMarkerSelection();
    if (shifted.kind === "arrow") {
      insertArrow(shifted.data);
    } else if (shifted.kind === "rect") {
      insertRect(shifted.data);
    } else if (shifted.kind === "text") {
      insertText(shifted.data);
    } else if (shifted.kind === "counter") {
      insertCounter(shifted.data);
    } else if (shifted.kind === "mosaic") {
      insertMosaic(shifted.data);
    } else {
      insertMarker(shifted.data);
    }
    return true;
  }, [
    clearArrowSelection,
    clearCounterSelection,
    clearLayerSelection,
    clearMarkerSelection,
    clearMosaicSelection,
    clearRectSelection,
    clearTextSelection,
    insertArrow,
    insertCounter,
    insertMarker,
    insertMosaic,
    insertRect,
    insertText,
    pushHistory,
  ]);

  const onDrawPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDrawingTool || cropping) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    clearAllSelections();
    draftRef.current = { pointerId: event.pointerId, x1: event.clientX, y1: event.clientY };
    const draft = { x1: event.clientX, y1: event.clientY, x2: event.clientX, y2: event.clientY };
    if (tool === "arrow") {
      setDraftArrow(draft);
    } else if (tool === "rect") {
      setDraftRect(draft);
    } else if (tool === "mosaic") {
      setDraftMosaic(draft);
    } else {
      setDraftMarker(draft);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDrawPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const draft = draftRef.current;
    if (!draft || draft.pointerId !== event.pointerId) {
      return;
    }
    const next = { x1: draft.x1, y1: draft.y1, x2: event.clientX, y2: event.clientY };
    if (tool === "arrow") {
      setDraftArrow(next);
    } else if (tool === "rect") {
      setDraftRect(next);
    } else if (tool === "mosaic") {
      setDraftMosaic(next);
    } else if (tool === "marker") {
      setDraftMarker(next);
    }
  };

  const onDrawPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const draft = draftRef.current;
    if (!draft || draft.pointerId !== event.pointerId) {
      return;
    }
    draftRef.current = null;
    const from = { x: draft.x1, y: draft.y1 };
    const to = { x: event.clientX, y: event.clientY };
    let createdId: string | null = null;
    if (tool === "arrow") {
      setDraftArrow(null);
      pushHistory();
      createdId = addArrow(from, to, annotationStyle);
    } else if (tool === "rect") {
      setDraftRect(null);
      pushHistory();
      createdId = addRect(from, to, annotationStyle);
    } else if (tool === "mosaic") {
      setDraftMosaic(null);
      pushHistory();
      createdId = addMosaic(from, to, mosaicStyle);
    } else if (tool === "marker") {
      setDraftMarker(null);
      pushHistory();
      createdId = addMarker(from, to, markerStyle, event.shiftKey);
    }
    if (createdId) {
      setTool("select");
    }
  };

  useEffect(() => {
    if (!selectedId) {
      exitCrop();
    }
  }, [selectedId, exitCrop]);

  useEffect(() => {
    const endGesture = () => {
      gestureRef.current = false;
    };
    window.addEventListener("pointerup", endGesture);
    window.addEventListener("pointercancel", endGesture);
    return () => {
      window.removeEventListener("pointerup", endGesture);
      window.removeEventListener("pointercancel", endGesture);
    };
  }, []);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    const onPaste = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target) || cropping) {
        return;
      }

      // paste イベント内の画像のみ。navigator.clipboard.read の古い画像で注釈ペーストを潰さない
      const eventImages = collectClipboardImagesFromEvent(event.clipboardData);
      if (eventImages.length > 0) {
        event.preventDefault();
        void placeFiles(eventImages);
        return;
      }

      if (pasteAnnotationClipboard()) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editingTextId) {
          setEditingTextId(null);
          return;
        }
        if (cropping) {
          exitCrop();
          return;
        }
        if (
          tool === "arrow" ||
          tool === "rect" ||
          tool === "text" ||
          tool === "counter" ||
          tool === "mosaic" ||
          tool === "marker"
        ) {
          setTool("select");
          setDraftArrow(null);
          setDraftRect(null);
          setDraftMosaic(null);
          setDraftMarker(null);
          draftRef.current = null;
          return;
        }
        clearAllSelections();
        return;
      }
      if (cropping && event.key === "Enter") {
        event.preventDefault();
        void confirmCrop();
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (mod && !isTypingTarget(event.target)) {
        const key = event.key.toLowerCase();
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          undo();
          return;
        }
        if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          redo();
          return;
        }
        if (key === "c" && !cropping) {
          if (copySelectedAnnotation()) {
            event.preventDefault();
          }
          return;
        }
      }

      if ((event.key === "Backspace" || event.key === "Delete") && !cropping) {
        if (isTypingTarget(event.target)) {
          return;
        }
        if (selectedArrowId) {
          event.preventDefault();
          pushHistory();
          removeSelectedArrow();
          return;
        }
        if (selectedRectId) {
          event.preventDefault();
          pushHistory();
          removeSelectedRect();
          return;
        }
        if (selectedTextId) {
          event.preventDefault();
          pushHistory();
          removeSelectedText();
          setEditingTextId(null);
          return;
        }
        if (selectedCounterId) {
          event.preventDefault();
          pushHistory();
          removeSelectedCounter();
          return;
        }
        if (selectedMosaicId) {
          event.preventDefault();
          pushHistory();
          removeSelectedMosaic();
          return;
        }
        if (selectedMarkerId) {
          event.preventDefault();
          pushHistory();
          removeSelectedMarker();
          return;
        }
        if (selectedId) {
          event.preventDefault();
          pushHistory();
          removeSelected();
        }
      }
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    clearAllSelections,
    confirmCrop,
    copySelectedAnnotation,
    cropping,
    editingTextId,
    exitCrop,
    pasteAnnotationClipboard,
    placeFiles,
    pushHistory,
    redo,
    removeSelected,
    removeSelectedArrow,
    removeSelectedCounter,
    removeSelectedMarker,
    removeSelectedMosaic,
    removeSelectedRect,
    removeSelectedText,
    selectedArrowId,
    selectedCounterId,
    selectedId,
    selectedMarkerId,
    selectedMosaicId,
    selectedRectId,
    selectedTextId,
    tool,
    undo,
  ]);

  const draftRectBox = draftRect
    ? normalizeRectFromDrag(draftRect.x1, draftRect.y1, draftRect.x2, draftRect.y2)
    : null;
  const draftMosaicBox = draftMosaic
    ? normalizeRectFromDrag(draftMosaic.x1, draftMosaic.y1, draftMosaic.x2, draftMosaic.y2)
    : null;

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) {
          void refreshCanPaste();
        }
      }}
    >
      <ContextMenuTrigger asChild>
        <main
          className={cn(
            "relative h-full w-full select-none",
            isDrawingTool && "cursor-crosshair",
            isTextTool && "cursor-text",
            isCounterTool && "cursor-crosshair",
            !isDrawingTool && !isTextTool && !isCounterTool && "cursor-default",
            isDragOver && "is-dragover",
          )}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onPointerDown={() => {
            if (!cropping && tool === "select") {
              clearAllSelections();
            }
          }}
          onContextMenu={(event) => {
            contextPointRef.current = { x: event.clientX, y: event.clientY };
            const arrowElement = (event.target as HTMLElement | null)?.closest?.("[data-arrow-id]");
            const arrowId = arrowElement?.getAttribute("data-arrow-id");
            if (arrowId) {
              setContextTarget("arrow");
              setSelectedArrowId(arrowId);
              clearLayerSelection();
              clearRectSelection();
              clearTextSelection();
              clearCounterSelection();
              clearMosaicSelection();
              clearMarkerSelection();
              setEditingTextId(null);
              return;
            }
            const rectElement = (event.target as HTMLElement | null)?.closest?.("[data-rect-id]");
            const rectId = rectElement?.getAttribute("data-rect-id");
            if (rectId) {
              setContextTarget("rect");
              setSelectedRectId(rectId);
              clearLayerSelection();
              clearArrowSelection();
              clearTextSelection();
              clearCounterSelection();
              clearMosaicSelection();
              clearMarkerSelection();
              setEditingTextId(null);
              return;
            }
            const textElement = (event.target as HTMLElement | null)?.closest?.("[data-text-id]");
            const textId = textElement?.getAttribute("data-text-id");
            if (textId) {
              setContextTarget("text");
              setSelectedTextId(textId);
              clearLayerSelection();
              clearArrowSelection();
              clearRectSelection();
              clearCounterSelection();
              clearMosaicSelection();
              clearMarkerSelection();
              return;
            }
            const counterElement = (event.target as HTMLElement | null)?.closest?.("[data-counter-id]");
            const counterId = counterElement?.getAttribute("data-counter-id");
            if (counterId) {
              setContextTarget("counter");
              setSelectedCounterId(counterId);
              clearLayerSelection();
              clearArrowSelection();
              clearRectSelection();
              clearTextSelection();
              clearMosaicSelection();
              clearMarkerSelection();
              setEditingTextId(null);
              return;
            }
            const mosaicElement = (event.target as HTMLElement | null)?.closest?.("[data-mosaic-id]");
            const mosaicId = mosaicElement?.getAttribute("data-mosaic-id");
            if (mosaicId) {
              setContextTarget("mosaic");
              setSelectedMosaicId(mosaicId);
              clearLayerSelection();
              clearArrowSelection();
              clearRectSelection();
              clearTextSelection();
              clearCounterSelection();
              clearMarkerSelection();
              setEditingTextId(null);
              return;
            }
            const markerElement = (event.target as HTMLElement | null)?.closest?.("[data-marker-id]");
            const markerId = markerElement?.getAttribute("data-marker-id");
            if (markerId) {
              setContextTarget("marker");
              setSelectedMarkerId(markerId);
              clearLayerSelection();
              clearArrowSelection();
              clearRectSelection();
              clearTextSelection();
              clearCounterSelection();
              clearMosaicSelection();
              setEditingTextId(null);
              return;
            }
            const layerElement = (event.target as HTMLElement | null)?.closest?.("[data-layer-id]");
            const layerId = layerElement?.getAttribute("data-layer-id");
            if (layerId) {
              setContextTarget("layer");
              clearArrowSelection();
              clearRectSelection();
              clearTextSelection();
              clearCounterSelection();
              clearMosaicSelection();
              clearMarkerSelection();
              setEditingTextId(null);
              if (!cropping || layerId === selectedId) {
                selectLayer(layerId);
              }
              return;
            }
            setContextTarget("canvas");
            if (!cropping) {
              clearAllSelections();
            }
          }}
        >
          <div className="checkerboard absolute inset-0" aria-hidden="true" />

          {isDragOver && (
            <div
              className="pointer-events-none absolute inset-2.5 z-20 rounded-2xl border-2 border-dashed border-ring bg-ring/10"
              aria-hidden="true"
            />
          )}

          {layers.length === 0 &&
            arrows.length === 0 &&
            rects.length === 0 &&
            texts.length === 0 &&
            counters.length === 0 &&
            mosaics.length === 0 &&
            markers.length === 0 && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-[1] w-[min(90vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/70 bg-background/75 px-7 py-5 text-center shadow-lg backdrop-blur-md">
              <p className="m-0 mb-1.5 text-lg font-semibold">画像を配置</p>
              <p className="m-0 text-sm text-muted-foreground">
                ドラッグ＆ドロップ、右クリックの貼り付け、または{" "}
                <KbdGroup>
                  <Kbd>⌘V</Kbd>
                  <span>/</span>
                  <Kbd>Ctrl+V</Kbd>
                </KbdGroup>
              </p>
            </div>
          )}

          {layers.map((layer, index) => (
            <LayerImage
              key={layer.id}
              layer={layer}
              selected={layer.id === selectedId && tool === "select"}
              cropping={cropping && layer.id === selectedId}
              crop={cropping && layer.id === selectedId ? crop : null}
              zIndex={index + 1}
              onSelect={() => {
                if (tool !== "select") {
                  return;
                }
                if (cropping && layer.id !== selectedId) {
                  return;
                }
                clearArrowSelection();
                clearRectSelection();
                clearTextSelection();
                clearCounterSelection();
                clearMosaicSelection();
                clearMarkerSelection();
                setEditingTextId(null);
                selectLayer(layer.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateLayer(layer.id, patch);
              }}
              onCropChange={setCrop}
            />
          ))}

          {selectedLayer && !cropping && tool === "select" && (
            <SelectionChrome
              layer={selectedLayer}
              onChange={(patch) => {
                beginGesture();
                updateLayer(selectedLayer.id, patch);
              }}
            />
          )}

          {mosaics.map((mosaic) => (
            <MosaicView
              key={mosaic.id}
              mosaic={mosaic}
              layers={layers}
              selected={mosaic.id === selectedMosaicId && tool === "select"}
              interactive={tool === "select" && !cropping}
              onSelect={() => {
                clearLayerSelection();
                clearArrowSelection();
                clearRectSelection();
                clearTextSelection();
                clearCounterSelection();
                clearMarkerSelection();
                setEditingTextId(null);
                setSelectedMosaicId(mosaic.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateMosaic(mosaic.id, patch);
              }}
            />
          ))}

          {arrows.map((arrow) => (
            <ArrowView
              key={arrow.id}
              arrow={arrow}
              selected={arrow.id === selectedArrowId && tool === "select"}
              interactive={tool === "select" && !cropping}
              onSelect={() => {
                clearLayerSelection();
                clearRectSelection();
                clearTextSelection();
                clearCounterSelection();
                clearMosaicSelection();
                clearMarkerSelection();
                setEditingTextId(null);
                setSelectedArrowId(arrow.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateArrow(arrow.id, patch);
              }}
            />
          ))}

          {rects.map((rect) => (
            <RectView
              key={rect.id}
              rect={rect}
              selected={rect.id === selectedRectId && tool === "select"}
              interactive={tool === "select" && !cropping}
              onSelect={() => {
                clearLayerSelection();
                clearArrowSelection();
                clearTextSelection();
                clearCounterSelection();
                clearMosaicSelection();
                clearMarkerSelection();
                setEditingTextId(null);
                setSelectedRectId(rect.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateRect(rect.id, patch);
              }}
            />
          ))}

          {texts.map((text) => (
            <TextView
              key={text.id}
              text={text}
              selected={text.id === selectedTextId && tool === "select"}
              interactive={tool === "select" && !cropping}
              editing={text.id === editingTextId}
              onSelect={() => {
                clearLayerSelection();
                clearArrowSelection();
                clearRectSelection();
                clearCounterSelection();
                clearMosaicSelection();
                clearMarkerSelection();
                setSelectedTextId(text.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateText(text.id, patch);
              }}
              onStartEdit={() => setEditingTextId(text.id)}
              onEndEdit={() => setEditingTextId(null)}
            />
          ))}

          {counters.map((counter) => (
            <CounterView
              key={counter.id}
              counter={counter}
              selected={counter.id === selectedCounterId && tool === "select"}
              interactive={tool === "select" && !cropping}
              onSelect={() => {
                clearLayerSelection();
                clearArrowSelection();
                clearRectSelection();
                clearTextSelection();
                clearMosaicSelection();
                clearMarkerSelection();
                setEditingTextId(null);
                setSelectedCounterId(counter.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateCounter(counter.id, patch);
              }}
            />
          ))}

          {markers.map((marker) => (
            <MarkerView
              key={marker.id}
              marker={marker}
              selected={marker.id === selectedMarkerId && tool === "select"}
              interactive={tool === "select" && !cropping}
              onSelect={() => {
                clearLayerSelection();
                clearArrowSelection();
                clearRectSelection();
                clearTextSelection();
                clearCounterSelection();
                clearMosaicSelection();
                setEditingTextId(null);
                setSelectedMarkerId(marker.id);
              }}
              onChange={(patch) => {
                beginGesture();
                updateMarker(marker.id, patch);
              }}
            />
          ))}

          {draftArrow && (
            <ArrowView
              arrow={{
                id: "draft",
                ...draftArrow,
                color: annotationStyle.color,
                strokeWidth: annotationStyle.strokeWidth,
              }}
              selected={false}
              interactive={false}
              onSelect={() => undefined}
              onChange={() => undefined}
            />
          )}

          {draftRect && draftRectBox && (
            <RectView
              rect={{
                id: "draft",
                ...draftRectBox,
                rotation: 0,
                color: annotationStyle.color,
                strokeWidth: annotationStyle.strokeWidth,
              }}
              selected={false}
              interactive={false}
              onSelect={() => undefined}
              onChange={() => undefined}
            />
          )}

          {draftMosaic && draftMosaicBox && (
            <MosaicView
              mosaic={{
                id: "draft",
                ...draftMosaicBox,
                rotation: 0,
                blockSize: mosaicStyle.blockSize,
              }}
              layers={[]}
              selected={false}
              interactive={false}
              onSelect={() => undefined}
              onChange={() => undefined}
            />
          )}

          {draftMarker && (
            <MarkerView
              marker={{
                id: "draft",
                ...draftMarker,
                color: markerStyle.color,
                strokeWidth: markerStyle.strokeWidth,
              }}
              selected={false}
              interactive={false}
              onSelect={() => undefined}
              onChange={() => undefined}
            />
          )}

          {isDrawingTool && !cropping && (
            <div
              className="absolute inset-0 z-[4500] cursor-crosshair"
              onPointerDown={onDrawPointerDown}
              onPointerMove={onDrawPointerMove}
              onPointerUp={onDrawPointerUp}
              onPointerCancel={onDrawPointerUp}
            />
          )}

          {isTextTool && !cropping && (
            <div
              className="absolute inset-0 z-[4500] cursor-text"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                placeTextAt({ x: event.clientX, y: event.clientY });
              }}
            />
          )}

          {isCounterTool && !cropping && (
            <div
              className="absolute inset-0 z-[4500] cursor-crosshair"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                placeCounterAt({ x: event.clientX, y: event.clientY });
              }}
            />
          )}

          <Toolbar
            cropping={cropping}
            canExport={canExport}
            exporting={exporting}
            canUndo={canUndo}
            canRedo={canRedo}
            canReset={canReset}
            tool={tool}
            showStrokeStyle={showStrokeStyle}
            showTextStyle={showTextStyle}
            showCounterStyle={showCounterStyle}
            showMosaicStyle={showMosaicStyle}
            showMarkerStyle={showMarkerStyle}
            annotationStyle={activeAnnotationStyle}
            textStyle={activeTextStyle}
            counterStyle={activeCounterStyle}
            mosaicStyle={activeMosaicStyle}
            markerStyle={activeMarkerStyle}
            annotationStyleLabel={annotationStyleLabel}
            onToolChange={(next) => {
              setTool(next);
              setDraftArrow(null);
              setDraftRect(null);
              setDraftMosaic(null);
              setDraftMarker(null);
              draftRef.current = null;
              setEditingTextId(null);
              if (
                next === "arrow" ||
                next === "rect" ||
                next === "text" ||
                next === "counter" ||
                next === "mosaic" ||
                next === "marker"
              ) {
                clearAllSelections();
                exitCrop();
              }
            }}
            onAnnotationStyleChange={onAnnotationStyleChange}
            onTextStyleChange={onTextStyleChange}
            onCounterStyleChange={onCounterStyleChange}
            onMosaicStyleChange={onMosaicStyleChange}
            onMarkerStyleChange={onMarkerStyleChange}
            onAdd={() => fileInputRef.current?.click()}
            onUndo={undo}
            onRedo={redo}
            onReset={reset}
            onDownload={() => void runExport("download")}
            onCopy={() => void runExport("copy")}
            onApplyCrop={() => void confirmCrop()}
            onCancelCrop={exitCrop}
          />

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
          />
        </main>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        <ContextMenuItem
          disabled={!canPasteImage}
          onSelect={() => {
            void pasteImagesAt(contextPointRef.current);
          }}
        >
          <ClipboardPaste />
          貼り付け
        </ContextMenuItem>

        {showArrowMenu && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                removeSelectedArrow();
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
          </>
        )}

        {showRectMenu && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                removeSelectedRect();
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
          </>
        )}

        {showTextMenu && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                removeSelectedText();
                setEditingTextId(null);
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
          </>
        )}

        {showCounterMenu && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                removeSelectedCounter();
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
          </>
        )}

        {showMosaicMenu && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                removeSelectedMosaic();
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
          </>
        )}

        {showMarkerMenu && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                removeSelectedMarker();
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
          </>
        )}

        {showLayerOrder && selectedId && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={cropping}
              onSelect={() => {
                startCrop();
              }}
            >
              <Crop />
              トリミング
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                pushHistory();
                exitCrop();
                removeSelected();
              }}
            >
              <Trash2 />
              削除
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={!canBringToFront}
              onSelect={() => {
                pushHistory();
                bringToFront(selectedId);
              }}
            >
              <ArrowUpToLine />
              最前面へ移動
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!canBringForward}
              onSelect={() => {
                pushHistory();
                bringForward(selectedId);
              }}
            >
              <ArrowUp />
              前面へ移動
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!canSendBackward}
              onSelect={() => {
                pushHistory();
                sendBackward(selectedId);
              }}
            >
              <ArrowDown />
              背面へ移動
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!canSendToBack}
              onSelect={() => {
                pushHistory();
                sendToBack(selectedId);
              }}
            >
              <ArrowDownToLine />
              最背面へ移動
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function hasImagePayload(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).some((type) => type === "Files" || type.startsWith("image/"));
}
