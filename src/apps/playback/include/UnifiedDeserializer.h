/*
 * =============================================================================
 * Project:      Beacon  
 * Application:  playback
 * Purpose:      Auto-detect and stream existing market data files
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "serializers/SerializerFactory.h"
#include "detection/ProtocolDetector.h"
#include <memory>
#include <vector>
#include <string>
#include <optional>
#include <set>
#include <fstream>
#include <algorithm>
#include <filesystem>

namespace beacon::market_data_playback {

/**
 * @brief Auto-detecting file reader for existing market data files
 * SINGLE PURPOSE: Detect protocol and create appropriate reader
 */
class AutoDetectingReader {
private:
    std::unique_ptr<beacon::exchanges::serializers::IDeserializeMarketData> _deserializer;
    std::string _filePath;
    beacon::exchanges::ExchangeType _detectedType;
    
public:
    /**
     * @brief Auto-detect protocol from existing file
     */
    explicit AutoDetectingReader(const std::string& filePath) : _filePath(filePath) {
        // Step 1: Auto-detect the protocol
        beacon::exchanges::detection::FileFormatDetector detector;
        _detectedType = detector.DetectFileFormat(filePath);
        
        if (_detectedType == beacon::exchanges::ExchangeType::INVALID) {
            throw std::runtime_error("Could not detect protocol for file: " + filePath);
        }
        
        // Step 2: Create the appropriate deserializer
        _deserializer = beacon::exchanges::serializers::SerializerFactory::CreateMarketDataDeserializer(
            _detectedType, 
            filePath
        );
        
        if (!_deserializer) {
            throw std::runtime_error("Failed to create deserializer for detected protocol");
        }
    }
    
    /**
     * @brief Get what protocol was detected
     */
    beacon::exchanges::ExchangeType GetDetectedProtocol() const {
        return _detectedType;
    }
    
    std::string GetProtocolName() const {
        switch (_detectedType) {
            case beacon::exchanges::ExchangeType::NASDAQ: return "NASDAQ ITCH 5.0";
            case beacon::exchanges::ExchangeType::CME: return "CME MDP 3.0"; 
            case beacon::exchanges::ExchangeType::NYSE: return "NYSE Pillar";
            default: return "Unknown";
        }
    }
    
    /**
     * @brief Stream messages efficiently
     */
    std::optional<beacon::exchanges::serializers::MarketDataMessage> ReadNext() {
        return _deserializer->DeserializeNext();
    }
    
    void Reset() { _deserializer->Reset(); }
    bool HasMore() const { return _deserializer->HasMore(); }
    
    /**
     * @brief Get file info for UI
     */
    struct FileInfo {
        std::string FilePath;
        std::string Protocol;
        beacon::exchanges::ExchangeType ExchangeType;
        size_t FileSize;
        std::string FileName;
    };
    
    FileInfo GetFileInfo() const {
        FileInfo info;
        info.FilePath = _filePath;
        info.Protocol = GetProtocolName();
        info.ExchangeType = _detectedType;
        info.FileName = std::filesystem::path(_filePath).filename().string();
        
        std::error_code ec;
        info.FileSize = std::filesystem::file_size(_filePath, ec);
        if (ec) info.FileSize = 0;
        
        return info;
    }
};

/**
 * @brief Streaming analyzer for large files - no bulk loading
 */
class StreamingAnalyzer {
public:
    struct StreamStats {
        size_t MessageCount = 0;
        std::set<std::string> UniqueSymbols;
        uint64_t FirstTimestamp = 0;
        uint64_t LastTimestamp = 0;
        std::string Protocol;
        
        // Convert to vector for UI
        std::vector<std::string> GetSymbolsVector() const {
            std::vector<std::string> symbols(UniqueSymbols.begin(), UniqueSymbols.end());
            std::sort(symbols.begin(), symbols.end());
            return symbols;
        }
    };
    
    /**
     * @brief Analyze file by streaming - handles huge files
     */
    static StreamStats AnalyzeFile(AutoDetectingReader& reader, size_t maxSample = 10000) {
        StreamStats stats;
        stats.Protocol = reader.GetProtocolName();
        
        reader.Reset();
        size_t sampled = 0;
        
        while (reader.HasMore() && sampled < maxSample) {
            auto msg = reader.ReadNext();
            if (!msg) break;
            
            stats.MessageCount++;
            sampled++;
            
            if (!msg->Symbol.empty()) {
                stats.UniqueSymbols.insert(msg->Symbol);
            }
            
            if (stats.MessageCount == 1) {
                stats.FirstTimestamp = msg->Timestamp;
            }
            stats.LastTimestamp = msg->Timestamp;
        }
        
        return stats;
    }
};

/**
 * @brief Simple playback controller - compose the pieces  
 */
class PlaybackSession {
private:
    std::unique_ptr<AutoDetectingReader> _reader;
    
public:
    /**
     * @brief Open existing file - auto-detect protocol
     */
    static std::unique_ptr<PlaybackSession> OpenFile(const std::string& filePath) {
        try {
            auto session = std::make_unique<PlaybackSession>();
            session->_reader = std::make_unique<AutoDetectingReader>(filePath);
            return session;
        } catch (const std::exception&) {
            return nullptr; // File couldn't be opened/detected
        }
    }
    
    /**
     * @brief Phase 1: Fast header-only preview for dropdown (<1ms)
     * NO message parsing - just protocol detection + math
     */
    static QuickPreview FastPreview(const std::string& filename) {
        QuickPreview preview;
        preview.FileName = filename;
        
        try {
            std::string fullPath = beacon::paths::GetDatasetPath(filename);
            
            // Get file size instantly
            std::error_code ec;
            size_t fileSize = std::filesystem::file_size(fullPath, ec);
            if (ec) throw std::runtime_error("File not accessible");
            preview.FileSizeMB = fileSize / (1024 * 1024);
            
            // Fast protocol detection - read only first 1KB
            beacon::exchanges::detection::FileFormatDetector detector;
            auto exchangeType = detector.DetectFileFormat(fullPath);
            
            switch (exchangeType) {
                case beacon::exchanges::ExchangeType::NASDAQ:
                    preview.Protocol = "NASDAQ ITCH 5.0";
                    preview.EstimatedMessages = fileSize / 50;  // ~50 bytes/msg avg
                    break;
                case beacon::exchanges::ExchangeType::CME:
                    preview.Protocol = "CME MDP 3.0";
                    preview.EstimatedMessages = fileSize / 80;  // ~80 bytes/msg avg
                    break;
                case beacon::exchanges::ExchangeType::NYSE:
                    preview.Protocol = "NYSE Pillar";
                    preview.EstimatedMessages = fileSize / 60;  // ~60 bytes/msg avg
                    break;
                default:
                    preview.Protocol = "Unknown";
                    preview.EstimatedMessages = 0;
            }
            
            preview.DetectionStatus = (exchangeType != beacon::exchanges::ExchangeType::INVALID) 
                ? "Detected" : "Unknown";
                
        } catch (...) {
            preview.Protocol = "Error";
            preview.DetectionStatus = "Failed";
            preview.EstimatedMessages = 0;
            preview.FileSizeMB = 0;
        }
        
        return preview;
    }
    
    /**
     * @brief Phase 2: Full analysis with loading indicator acceptable
     * Complete symbol parsing and validation
     */
    static FullAnalysis DeepAnalysis(const std::string& filename) {
        FullAnalysis analysis;
        analysis.FileName = filename;
        
        try {
            std::string fullPath = beacon::paths::GetDatasetPath(filename);
            AutoDetectingReader reader(fullPath);
            
            auto fileInfo = reader.GetFileInfo();
            analysis.Protocol = fileInfo.Protocol;
            analysis.FileSizeMB = fileInfo.FileSize / (1024 * 1024);
            analysis.ExchangeType = fileInfo.ExchangeType;
            
            // Full analysis - parse all messages for accurate data
            auto stats = StreamingAnalyzer::AnalyzeFile(reader, SIZE_MAX); // No limit
            analysis.ActualMessageCount = stats.MessageCount;
            analysis.AllSymbols = stats.GetSymbolsVector();
            
            // Format time range
            if (stats.FirstTimestamp > 0 && stats.LastTimestamp > 0) {
                // Simple timestamp formatting - enhance as needed
                analysis.TimeRange = std::to_string(stats.FirstTimestamp) + 
                                   " - " + std::to_string(stats.LastTimestamp);
            } else {
                analysis.TimeRange = "Unknown";
            }
            
            // Exchange validation
            analysis.ValidationPassed = (analysis.ExchangeType != beacon::exchanges::ExchangeType::INVALID);
            analysis.ValidationError = analysis.ValidationPassed ? "" : "Invalid exchange format";
            
        } catch (const std::exception& e) {
            analysis.Protocol = "Error";
            analysis.ActualMessageCount = 0;
            analysis.ValidationPassed = false;
            analysis.ValidationError = e.what();
        }
        
        return analysis;
    }
    
    // Delegate to reader
    std::optional<beacon::exchanges::serializers::MarketDataMessage> ReadNext() {
        return _reader ? _reader->ReadNext() : std::nullopt;
    }
    
    void Reset() { if (_reader) _reader->Reset(); }
    bool HasMore() const { return _reader ? _reader->HasMore() : false; }
    
    AutoDetectingReader::FileInfo GetFileInfo() const {
        return _reader ? _reader->GetFileInfo() : AutoDetectingReader::FileInfo{};
    }
    
    StreamingAnalyzer::StreamStats AnalyzeFile(size_t maxSample = 10000) {
        return _reader ? StreamingAnalyzer::AnalyzeFile(*_reader, maxSample) : StreamingAnalyzer::StreamStats{};
    }
    
    /**
     * @brief Phase 1: Instant preview for dropdown selection (<1ms)
     * Header-only analysis - no message parsing
     */
    struct QuickPreview {
        std::string Protocol;           // "NASDAQ ITCH 5.0"
        std::string FileName;
        size_t FileSizeMB;
        size_t EstimatedMessages;       // File size / avg message size
        std::string DetectionStatus;    // "Detected" or "Unknown"
        
        // JSON-ready format for web UI
        std::string ToJson() const {
            std::string symbolsList = "[";
            for (size_t i = 0; i < TopSymbols.size(); ++i) {
                symbolsList += "\"" + TopSymbols[i] + "\"";
                if (i < TopSymbols.size() - 1) symbolsList += ",";
            }
            symbolsList += "]";
            
        return "{"
            "\"protocol\":\"" + Protocol + "\","
            "\"fileName\":\"" + FileName + "\","
            "\"fileSizeMB\":" + std::to_string(FileSizeMB) + ","
            "\"estimatedMessages\":" + std::to_string(EstimatedMessages) + ","
            "\"detectionStatus\":\"" + DetectionStatus + "\""
            "}";
        }
    };
    
    /**
     * @brief Phase 2: Full analysis when user starts playback
     * Complete parsing with loading indicator acceptable
     */
    struct FullAnalysis {
        std::string Protocol;
        std::string FileName;
        size_t FileSizeMB;
        size_t ActualMessageCount;      // Real count from parsing
        std::vector<std::string> AllSymbols;     // All unique symbols found
        std::string TimeRange;          // "09:30:00 - 16:00:00"
        beacon::exchanges::ExchangeType ExchangeType;
        bool ValidationPassed;          // Exchange validation result
        std::string ValidationError;    // If validation failed
        
        std::string ToJson() const {
            std::string symbolsList = "[";
            for (size_t i = 0; i < AllSymbols.size(); ++i) {
                symbolsList += "\"" + AllSymbols[i] + "\"";
                if (i < AllSymbols.size() - 1) symbolsList += ",";
            }
            symbolsList += "]";
            
            return "{"
                "\"protocol\":\"" + Protocol + "\","
                "\"fileName\":\"" + FileName + "\","
                "\"fileSizeMB\":" + std::to_string(FileSizeMB) + ","
                "\"actualMessages\":" + std::to_string(ActualMessageCount) + ","
                "\"allSymbols\":" + symbolsList + ","
                "\"timeRange\":\"" + TimeRange + "\","
                "\"validationPassed\":" + (ValidationPassed ? "true" : "false") + ","
                "\"validationError\":\"" + ValidationError + "\""
                "}";
        }
    };    /**
     * @brief Get quick preview for current session's file
     */
    QuickPreview GetQuickPreview() {
        if (!_reader) return QuickPreview{};
        
        auto fileInfo = _reader->GetFileInfo();
        return FastPreview(fileInfo.FileName);
    }
    
    /**
     * @brief Get full analysis for current session's file  
     */
    FullAnalysis GetFullAnalysis() {
        if (!_reader) return FullAnalysis{};
        
        auto fileInfo = _reader->GetFileInfo();
        return DeepAnalysis(fileInfo.FileName);
    }
};

} // namespace beacon::market_data_playback