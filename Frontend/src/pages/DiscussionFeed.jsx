import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CollaborationHub = ({ projectId, currentUserEmail, currentUserRole }) => {
    const [messages, setMessages] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [mentionedEmail, setMentionedEmail] = useState('');

    // Fetch discussion feed for the specific project
    const fetchFeed = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/discussion/feed/${projectId}`);
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching discussion feed:", error);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchFeed();
        }
    }, [projectId]);

    // Handle posting a new message
    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        const messagePayload = {
            projectId: projectId,
            senderEmail: currentUserEmail,
            senderRole: currentUserRole,
            content: newContent,
            mentionedUserEmail: mentionedEmail ? mentionedEmail : null
        };

        try {
            await axios.post('http://localhost:8080/api/discussion/post', messagePayload);
            setNewContent('');
            setMentionedEmail('');
            fetchFeed(); // Refresh the feed
        } catch (error) {
            console.error("Error posting message:", error);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2>Project Collaboration Hub</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>Project ID: {projectId}</p>

            {/* Message Input Form */}
            <form onSubmit={handlePostMessage} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                    rows="3"
                    placeholder="Write a message or update for the team... (You can discuss project milestones, feedback, etc.)"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                    required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="email"
                        placeholder="Mention user email (optional e.g. mentor@example.com)"
                        value={mentionedEmail}
                        onChange={(e) => setMentionedEmail(e.target.value)}
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                        type="submit"
                        style={{ padding: '8px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Post Message
                    </button>
                </div>
            </form>

            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

            {/* Messages Feed List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center' }}>No messages yet for this project. Start the conversation!</p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} style={{ padding: '12px 15px', background: '#f8f9fa', borderRadius: '6px', borderLeft: '4px solid #007bff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: '#555' }}>
                                <span><strong>{msg.senderEmail}</strong> <span style={{ background: '#e2e3e5', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '5px' }}>{msg.senderRole}</span></span>
                                <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: '5px 0', color: '#333', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                            {msg.mentionedUserEmail && (
                                <div style={{ fontSize: '12px', color: '#d9534f', marginTop: '5px' }}>
                                    Mentioned: @{msg.mentionedUserEmail}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CollaborationHub;